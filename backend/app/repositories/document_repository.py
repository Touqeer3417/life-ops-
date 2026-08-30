import uuid
from collections.abc import (
    Sequence,
)
from dataclasses import (
    dataclass,
    field,
)
from datetime import (
    UTC,
    datetime,
)
from typing import Any

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import (
    noload,
)

from app.models.document import (
    Document,
    DocumentStatus,
)
from app.models.document_chunk import (
    DocumentChunk,
)


@dataclass(
    frozen=True,
    slots=True,
)
class DocumentChunkCreate:
    chunk_index: int
    content: str

    embedding: Sequence[
        float
    ]

    page_number: int | None
    source: str | None

    metadata: dict[
        str,
        Any,
    ]


@dataclass(
    frozen=True,
    slots=True,
)
class RetrievedChunk:
    chunk_id: uuid.UUID

    document_id: uuid.UUID

    filename: str

    chunk_index: int

    content: str

    page_number: int | None

    source: str | None

    # Dense vector similarity from pgvector.
    similarity: float

    # Structure-aware information such as:
    #
    # parent_id
    # parent_content
    # section_title
    # section_path
    # content_type
    # table headers
    #
    # will live here without requiring another DB table.
    metadata: dict[
        str,
        Any,
    ] = field(
        default_factory=dict
    )

    # Second-stage neural relevance score.
    #
    # None means this candidate has not passed through
    # the CrossEncoder yet.
    rerank_score: float | None = (
        None
    )


class DocumentRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = (
            session
        )

    async def get_by_checksum(
        self,
        *,
        user_id: uuid.UUID,
        checksum: str,
    ) -> Document | None:
        result = (
            await self.session
            .execute(
                select(
                    Document
                )
                .options(
                    noload(
                        Document.chunks
                    ),
                    noload(
                        Document.user
                    ),
                )
                .where(
                    Document.user_id
                    == user_id,

                    Document.checksum
                    == checksum,
                )
            )
        )

        return (
            result
            .scalar_one_or_none()
        )

    async def get_by_id(
        self,
        *,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Document | None:
        result = (
            await self.session
            .execute(
                select(
                    Document
                )
                .options(
                    noload(
                        Document.chunks
                    ),
                    noload(
                        Document.user
                    ),
                )
                .where(
                    Document.id
                    == document_id,

                    Document.user_id
                    == user_id,
                )
            )
        )

        return (
            result
            .scalar_one_or_none()
        )

    async def list_for_user(
        self,
        *,
        user_id: uuid.UUID,
        search: str | None = None,
    ) -> list[
        Document
    ]:
        statement = (
            select(
                Document
            )
            .options(
                noload(
                    Document.chunks
                ),
                noload(
                    Document.user
                ),
            )
            .where(
                Document.user_id
                == user_id
            )
        )

        normalized_search = (
            search.strip()
            if search
            else ""
        )

        if normalized_search:
            escaped_search = (
                self._escape_like(
                    normalized_search
                )
            )

            statement = (
                statement.where(
                    Document
                    .original_filename
                    .ilike(
                        (
                            f"%"
                            f"{escaped_search}"
                            f"%"
                        ),
                        escape="\\",
                    )
                )
            )

        statement = (
            statement.order_by(
                Document
                .created_at
                .desc()
            )
        )

        result = (
            await self.session
            .execute(
                statement
            )
        )

        return list(
            result.scalars().all()
        )

    async def count_for_user(
        self,
        *,
        user_id: uuid.UUID,
    ) -> int:
        result = (
            await self.session
            .execute(
                select(
                    func.count(
                        Document.id
                    )
                )
                .where(
                    Document.user_id
                    == user_id
                )
            )
        )

        return int(
            result.scalar_one()
        )

    async def count_chunks(
        self,
        *,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> int:
        result = (
            await self.session
            .execute(
                select(
                    func.count(
                        DocumentChunk.id
                    )
                )
                .join(
                    Document,
                    (
                        Document.id
                        ==
                        DocumentChunk
                        .document_id
                    ),
                )
                .where(
                    Document.id
                    == document_id,

                    Document.user_id
                    == user_id,
                )
            )
        )

        return int(
            result.scalar_one()
        )

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        original_filename: str,
        stored_filename: str,
        stored_path: str,
        mime_type: str,
        file_extension: str,
        file_size: int,
        checksum: str,
    ) -> Document:
        document = Document(
            user_id=user_id,

            original_filename=(
                original_filename
            ),

            stored_filename=(
                stored_filename
            ),

            stored_path=(
                stored_path
            ),

            mime_type=(
                mime_type
            ),

            file_extension=(
                file_extension
            ),

            file_size=(
                file_size
            ),

            checksum=(
                checksum
            ),

            status=(
                DocumentStatus
                .PROCESSING
                .value
            ),
        )

        self.session.add(
            document
        )

        await self.session.flush()

        return document

    async def add_chunks(
        self,
        *,
        document: Document,
        chunks: Sequence[
            DocumentChunkCreate
        ],
    ) -> list[
        DocumentChunk
    ]:
        created_chunks: list[
            DocumentChunk
        ] = []

        for chunk_data in chunks:
            chunk = (
                DocumentChunk(
                    document_id=(
                        document.id
                    ),

                    chunk_index=(
                        chunk_data
                        .chunk_index
                    ),

                    content=(
                        chunk_data.content
                    ),

                    embedding=list(
                        chunk_data
                        .embedding
                    ),

                    page_number=(
                        chunk_data
                        .page_number
                    ),

                    source=(
                        chunk_data.source
                    ),

                    chunk_metadata=dict(
                        chunk_data
                        .metadata
                    ),
                )
            )

            self.session.add(
                chunk
            )

            created_chunks.append(
                chunk
            )

        await self.session.flush()

        return created_chunks

    async def mark_indexed(
        self,
        document: Document,
    ) -> Document:
        document.status = (
            DocumentStatus
            .INDEXED
            .value
        )

        document.processing_error = (
            None
        )

        document.indexed_at = (
            datetime.now(
                UTC
            )
        )

        await self.session.flush()

        return document

    async def mark_failed(
        self,
        document: Document,
        *,
        error_message: str,
    ) -> Document:
        document.status = (
            DocumentStatus
            .FAILED
            .value
        )

        document.processing_error = (
            error_message.strip()
            or
            "Document processing failed"
        )

        document.indexed_at = (
            None
        )

        await self.session.flush()

        return document

    async def delete(
        self,
        document: Document,
    ) -> None:
        await self.session.delete(
            document
        )

        await self.session.flush()

    async def semantic_search(
        self,
        *,
        user_id: uuid.UUID,
        query_embedding: Sequence[
            float
        ],
        top_k: int,
        similarity_threshold: float,
    ) -> list[
        RetrievedChunk
    ]:
        """
        High-recall dense retrieval.

        This method intentionally does NOT perform the final
        relevance decision.

        Final precision filtering belongs to the second-stage
        CrossEncoder reranker.
        """

        if not query_embedding:
            return []

        if top_k <= 0:
            return []

        if (
            similarity_threshold < 0.0
            or similarity_threshold > 1.0
        ):
            raise ValueError(
                "Similarity threshold must "
                "be between 0 and 1"
            )

        distance = (
            DocumentChunk
            .embedding
            .cosine_distance(
                list(
                    query_embedding
                )
            )
        )

        maximum_distance = (
            1.0
            - similarity_threshold
        )

        statement = (
            select(
                DocumentChunk.id,

                DocumentChunk
                .document_id,

                Document
                .original_filename,

                DocumentChunk
                .chunk_index,

                DocumentChunk
                .content,

                DocumentChunk
                .page_number,

                DocumentChunk
                .source,

                DocumentChunk
                .chunk_metadata
                .label(
                    "chunk_metadata"
                ),

                distance.label(
                    "distance"
                ),
            )
            .join(
                Document,
                (
                    Document.id
                    ==
                    DocumentChunk
                    .document_id
                ),
            )
            .where(
                Document.user_id
                == user_id,

                Document.status
                ==
                DocumentStatus
                .INDEXED
                .value,

                distance
                <= maximum_distance,
            )
            .order_by(
                distance.asc()
            )
            .limit(
                top_k
            )
        )

        result = (
            await self.session
            .execute(
                statement
            )
        )

        retrieved: list[
            RetrievedChunk
        ] = []

        for row in result.all():
            distance_value = (
                float(
                    row.distance
                )
            )

            similarity = (
                1.0
                - distance_value
            )

            # Defensive clamp because cosine calculations
            # can occasionally produce tiny floating-point
            # values outside the expected range.
            similarity = max(
                0.0,
                min(
                    1.0,
                    similarity,
                ),
            )

            raw_metadata = (
                row.chunk_metadata
            )

            metadata: dict[
                str,
                Any,
            ]

            if isinstance(
                raw_metadata,
                dict,
            ):
                metadata = dict(
                    raw_metadata
                )
            else:
                metadata = {}

            retrieved.append(
                RetrievedChunk(
                    chunk_id=(
                        row.id
                    ),

                    document_id=(
                        row.document_id
                    ),

                    filename=(
                        row.original_filename
                    ),

                    chunk_index=(
                        row.chunk_index
                    ),

                    content=(
                        row.content
                    ),

                    page_number=(
                        row.page_number
                    ),

                    source=(
                        row.source
                    ),

                    similarity=(
                        similarity
                    ),

                    metadata=(
                        metadata
                    ),

                    rerank_score=None,
                )
            )

        return retrieved

    async def has_indexed_documents(
        self,
        *,
        user_id: uuid.UUID,
    ) -> bool:
        result = (
            await self.session
            .execute(
                select(
                    Document.id
                )
                .where(
                    Document.user_id
                    == user_id,

                    Document.status
                    ==
                    DocumentStatus
                    .INDEXED
                    .value,
                )
                .limit(
                    1
                )
            )
        )

        return (
            result.scalar_one_or_none()
            is not None
        )

    @staticmethod
    def _escape_like(
        value: str,
    ) -> str:
        return (
            value
            .replace(
                "\\",
                "\\\\",
            )
            .replace(
                "%",
                "\\%",
            )
            .replace(
                "_",
                "\\_",
            )
        )