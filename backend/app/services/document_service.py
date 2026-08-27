import hashlib
import uuid
from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from fastapi import UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    AppError,
    ConflictError,
    DocumentProcessingError,
    NotFoundError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)
from app.models.document import Document
from app.models.user import User
from app.rag.parsers import get_extension, parse_document
from app.rag.providers import (
    EmbeddingProvider,
    create_embedding_provider,
)
from app.rag.storage import LocalFileStorage
from app.rag.text import chunk_document
from app.repositories.document_repository import (
    DocumentChunkCreate,
    DocumentRepository,
)
from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentDetailRead,
    DocumentListResponse,
    DocumentRead,
    DocumentSearchRequest,
    DocumentSearchResponse,
    DocumentSearchResult,
    DocumentUploadResponse,
)


_ALLOWED_MIME_TYPES: dict[str, frozenset[str]] = {
    ".pdf": frozenset(
        {
            "application/pdf",
            "application/x-pdf",
            "application/octet-stream",
        }
    ),
    ".docx": frozenset(
        {
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document",
            "application/zip",
            "application/octet-stream",
        }
    ),
    ".txt": frozenset(
        {
            "text/plain",
            "application/octet-stream",
        }
    ),
    ".md": frozenset(
        {
            "text/markdown",
            "text/x-markdown",
            "text/plain",
            "application/octet-stream",
        }
    ),
}


class DocumentService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings | None = None,
    ) -> None:
        self.session = session
        self.settings = settings or get_settings()
        self.repository = DocumentRepository(session)
        self.storage = LocalFileStorage(self.settings)
        self._embedding_provider: EmbeddingProvider | None = None

    @property
    def embedding_provider(self) -> EmbeddingProvider:
        if self._embedding_provider is None:
            self._embedding_provider = create_embedding_provider(
                self.settings
            )
        return self._embedding_provider

    async def upload_document(
        self,
        *,
        current_user: User,
        upload: UploadFile,
    ) -> DocumentUploadResponse:
        original_filename = self._normalize_filename(
            upload.filename
        )
        extension = get_extension(
            original_filename
        )

        self._validate_extension(
            extension
        )
        self._validate_mime_type(
            extension=extension,
            content_type=upload.content_type,
        )

        file_bytes = await self._read_upload(
            upload
        )

        self._validate_content_signature(
            extension=extension,
            file_bytes=file_bytes,
        )

        checksum = hashlib.sha256(
            file_bytes
        ).hexdigest()

        existing = await self.repository.get_by_checksum(
            user_id=current_user.id,
            checksum=checksum,
        )

        if existing is not None:
            raise ConflictError(
                "This document has already been uploaded"
            )

        stored_file = await self.storage.save(
            user_id=current_user.id,
            file_bytes=file_bytes,
            extension=extension,
        )

        document: Document | None = None

        try:
            document = await self.repository.create(
                user_id=current_user.id,
                original_filename=original_filename,
                stored_filename=stored_file.stored_filename,
                stored_path=stored_file.stored_path,
                mime_type=self._normalized_mime_type(
                    upload.content_type,
                    extension,
                ),
                file_extension=extension,
                file_size=len(file_bytes),
                checksum=checksum,
            )

            await self.session.commit()

        except IntegrityError as exc:
            await self.session.rollback()

            await self.storage.delete(
                stored_file.stored_path
            )

            raise ConflictError(
                "This document has already been uploaded"
            ) from exc

        except Exception:
            await self.session.rollback()

            await self.storage.delete(
                stored_file.stored_path
            )

            raise

        try:
            parsed_document = parse_document(
                file_bytes=file_bytes,
                filename=original_filename,
                extension=extension,
            )

            prepared_chunks = chunk_document(
                parsed_document=parsed_document,
                filename=original_filename,
                chunk_size=self.settings.chunk_size,
                chunk_overlap=self.settings.chunk_overlap,
            )

            texts = [
                chunk.content
                for chunk in prepared_chunks
            ]

            embeddings = (
                await self.embedding_provider.embed_documents(
                    texts
                )
            )

            if len(embeddings) != len(prepared_chunks):
                raise DocumentProcessingError(
                    "Document embeddings could not be generated correctly"
                )

            chunk_records: list[
                DocumentChunkCreate
            ] = []

            for prepared_chunk, embedding in zip(
                prepared_chunks,
                embeddings,
                strict=True,
            ):
                metadata = dict(
                    prepared_chunk.metadata
                )

                metadata.update(
                    {
                        "document_id": str(document.id),
                        "filename": original_filename,
                        "source": prepared_chunk.source,
                    }
                )

                if prepared_chunk.page_number is not None:
                    metadata["page_number"] = (
                        prepared_chunk.page_number
                    )

                chunk_records.append(
                    DocumentChunkCreate(
                        chunk_index=prepared_chunk.chunk_index,
                        content=prepared_chunk.content,
                        embedding=embedding,
                        page_number=prepared_chunk.page_number,
                        source=prepared_chunk.source,
                        metadata=metadata,
                    )
                )

            await self.repository.add_chunks(
                document=document,
                chunks=chunk_records,
            )

            await self.repository.mark_indexed(
                document
            )

            await self.session.commit()

        except Exception as exc:
            await self.session.rollback()

            await self._persist_failed_status(
                user_id=current_user.id,
                document_id=document.id,
                exc=exc,
            )

            if isinstance(exc, AppError):
                raise

            raise DocumentProcessingError(
                "The document could not be indexed"
            ) from exc

        indexed_document = (
            await self.repository.get_by_id(
                user_id=current_user.id,
                document_id=document.id,
            )
        )

        if indexed_document is None:
            raise DocumentProcessingError(
                "The indexed document could not be loaded"
            )

        return DocumentUploadResponse(
            document=DocumentRead.model_validate(
                indexed_document
            ),
            message="Document uploaded and indexed successfully",
        )

    async def list_documents(
        self,
        *,
        current_user: User,
        search: str | None = None,
    ) -> DocumentListResponse:
        documents = await self.repository.list_for_user(
            user_id=current_user.id,
            search=search,
        )

        return DocumentListResponse(
            documents=[
                DocumentRead.model_validate(
                    document
                )
                for document in documents
            ],
            total=len(documents),
        )

    async def get_document(
        self,
        *,
        current_user: User,
        document_id: uuid.UUID,
    ) -> DocumentDetailRead:
        document = await self.repository.get_by_id(
            user_id=current_user.id,
            document_id=document_id,
        )

        if document is None:
            raise NotFoundError(
                "Document not found"
            )

        chunk_count = await self.repository.count_chunks(
            user_id=current_user.id,
            document_id=document.id,
        )

        data = DocumentRead.model_validate(
            document
        ).model_dump()

        return DocumentDetailRead(
            **data,
            chunk_count=chunk_count,
        )

    async def delete_document(
        self,
        *,
        current_user: User,
        document_id: uuid.UUID,
    ) -> DocumentDeleteResponse:
        document = await self.repository.get_by_id(
            user_id=current_user.id,
            document_id=document_id,
        )

        if document is None:
            raise NotFoundError(
                "Document not found"
            )

        stored_path = document.stored_path

        try:
            await self.storage.delete(
                stored_path
            )

            await self.repository.delete(
                document
            )

            await self.session.commit()

        except Exception:
            await self.session.rollback()
            raise

        return DocumentDeleteResponse(
            id=document_id,
            message="Document deleted successfully",
        )

    async def search_documents(
        self,
        *,
        current_user: User,
        payload: DocumentSearchRequest,
    ) -> DocumentSearchResponse:
        has_documents = (
            await self.repository.has_indexed_documents(
                user_id=current_user.id
            )
        )

        if not has_documents:
            return DocumentSearchResponse(
                query=payload.query,
                results=[],
                total=0,
            )

        query_embedding = (
            await self.embedding_provider.embed_query(
                payload.query
            )
        )

        retrieved = (
            await self.repository.semantic_search(
                user_id=current_user.id,
                query_embedding=query_embedding,
                top_k=(
                    payload.top_k
                    or self.settings.retrieval_top_k
                ),
                similarity_threshold=(
                    self.settings
                    .retrieval_similarity_threshold
                ),
            )
        )

        results = [
            DocumentSearchResult(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                filename=chunk.filename,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                page_number=chunk.page_number,
                source=chunk.source,
                similarity=chunk.similarity,
            )
            for chunk in retrieved
        ]

        return DocumentSearchResponse(
            query=payload.query,
            results=results,
            total=len(results),
        )

    async def _read_upload(
        self,
        upload: UploadFile,
    ) -> bytes:
        max_bytes = (
            self.settings.max_file_size_bytes
        )

        try:
            file_bytes = await upload.read(
                max_bytes + 1
            )
        except Exception as exc:
            raise DocumentProcessingError(
                "Unable to read the uploaded document"
            ) from exc

        if not file_bytes:
            raise DocumentProcessingError(
                "The uploaded document is empty"
            )

        if len(file_bytes) > max_bytes:
            raise PayloadTooLargeError(
                "The uploaded file exceeds the "
                f"{self.settings.max_file_size_mb} MB limit"
            )

        return file_bytes

    async def _persist_failed_status(
        self,
        *,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        exc: Exception,
    ) -> None:
        try:
            document = await self.repository.get_by_id(
                user_id=user_id,
                document_id=document_id,
            )

            if document is None:
                return

            await self.repository.mark_failed(
                document,
                error_message=self._safe_error_message(
                    exc
                ),
            )

            await self.session.commit()

        except Exception:
            await self.session.rollback()

    def _validate_extension(
        self,
        extension: str,
    ) -> None:
        if (
            extension
            not in self.settings.allowed_extension_set
        ):
            supported = ", ".join(
                sorted(
                    self.settings.allowed_extension_set
                )
            )

            raise UnsupportedMediaTypeError(
                "Unsupported file type. "
                f"Allowed types: {supported}"
            )

    @staticmethod
    def _validate_mime_type(
        *,
        extension: str,
        content_type: str | None,
    ) -> None:
        if not content_type:
            return

        normalized = (
            content_type
            .split(";", maxsplit=1)[0]
            .strip()
            .lower()
        )

        allowed = _ALLOWED_MIME_TYPES.get(
            extension
        )

        if allowed is None:
            raise UnsupportedMediaTypeError(
                "Unsupported document type"
            )

        if normalized not in allowed:
            raise UnsupportedMediaTypeError(
                "The uploaded file content type "
                "does not match its extension"
            )

    @staticmethod
    def _validate_content_signature(
        *,
        extension: str,
        file_bytes: bytes,
    ) -> None:
        if extension == ".pdf":
            prefix = file_bytes[:1024].lstrip()

            if not prefix.startswith(
                b"%PDF-"
            ):
                raise DocumentProcessingError(
                    "The uploaded file is not a valid PDF"
                )

            return

        if extension == ".docx":
            if not file_bytes.startswith(
                b"PK"
            ):
                raise DocumentProcessingError(
                    "The uploaded file is not a valid DOCX document"
                )

            try:
                with ZipFile(
                    BytesIO(file_bytes)
                ) as archive:
                    names = set(
                        archive.namelist()
                    )

                    required = {
                        "[Content_Types].xml",
                        "word/document.xml",
                    }

                    if not required.issubset(
                        names
                    ):
                        raise DocumentProcessingError(
                            "The uploaded file is not a valid DOCX document"
                        )

            except BadZipFile as exc:
                raise DocumentProcessingError(
                    "The uploaded DOCX file is corrupted"
                ) from exc

            return

        if extension in {".txt", ".md"}:
            sample = file_bytes[:8192]

            if b"\x00" in sample:
                raise DocumentProcessingError(
                    "The uploaded text document appears to contain binary data"
                )

    @staticmethod
    def _normalize_filename(
        filename: str | None,
    ) -> str:
        if not filename:
            raise DocumentProcessingError(
                "Uploaded document filename is missing"
            )

        normalized = Path(
            filename
        ).name.strip()

        if not normalized:
            raise DocumentProcessingError(
                "Uploaded document filename is invalid"
            )

        if len(normalized) > 512:
            raise DocumentProcessingError(
                "Uploaded document filename is too long"
            )

        return normalized

    @staticmethod
    def _normalized_mime_type(
        content_type: str | None,
        extension: str,
    ) -> str:
        if content_type:
            normalized = (
                content_type
                .split(";", maxsplit=1)[0]
                .strip()
                .lower()
            )

            if normalized:
                return normalized

        defaults = {
            ".pdf": "application/pdf",
            ".docx": (
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
            ".txt": "text/plain",
            ".md": "text/markdown",
        }

        return defaults[extension]

    @staticmethod
    def _safe_error_message(
        exc: Exception,
    ) -> str:
        if isinstance(exc, AppError):
            return exc.message[:1000]

        return "Document indexing failed"