import uuid
from typing import Annotated

from fastapi import (
    APIRouter,
    File,
    Query,
    UploadFile,
    status,
)

from app.dependencies import (
    CurrentUserDep,
    SessionDep,
)
from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentDetailRead,
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    DocumentStatusResponse,
    DocumentUploadResponse,
)
from app.services.document_service import DocumentService


router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: Annotated[
        UploadFile,
        File(
            description=(
                "Document to upload. "
                "Supported formats: PDF, DOCX, TXT, MD."
            )
        ),
    ],
    current_user: CurrentUserDep,
    session: SessionDep,
) -> DocumentUploadResponse:
    """
    Upload, parse, chunk, embed, and index a document.

    Ownership is taken from the authenticated database user.
    Client-supplied user IDs are never accepted.
    """
    service = DocumentService(
        session
    )

    try:
        return await service.upload_document(
            current_user=current_user,
            upload=file,
        )
    finally:
        await file.close()


@router.get(
    "",
    response_model=DocumentListResponse,
)
async def list_documents(
    current_user: CurrentUserDep,
    session: SessionDep,
    search: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=512,
            description=(
                "Optional filename search."
            ),
        ),
    ] = None,
) -> DocumentListResponse:
    """
    List documents owned by the authenticated user.

    The optional search parameter performs filename filtering.
    """
    return await DocumentService(
        session
    ).list_documents(
        current_user=current_user,
        search=search,
    )


@router.post(
    "/search",
    response_model=DocumentSearchResponse,
)
async def search_documents(
    payload: DocumentSearchRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> DocumentSearchResponse:
    """
    Perform semantic search over the current user's indexed documents.
    """
    return await DocumentService(
        session
    ).search_documents(
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetailRead,
)
async def get_document(
    document_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> DocumentDetailRead:
    """
    Return metadata for one document owned by the current user.

    Documents belonging to other users are returned as not found rather
    than revealing that the document exists.
    """
    return await DocumentService(
        session
    ).get_document(
        current_user=current_user,
        document_id=document_id,
    )


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
)
async def get_document_status(
    document_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> DocumentStatusResponse:
    """
    Return the processing/indexing status of an owned document.
    """
    document = await DocumentService(
        session
    ).get_document(
        current_user=current_user,
        document_id=document_id,
    )

    return DocumentStatusResponse(
        id=document.id,
        status=document.status,
        processing_error=document.processing_error,
        indexed_at=document.indexed_at,
    )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
)
async def delete_document(
    document_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> DocumentDeleteResponse:
    """
    Delete an owned document, its stored file, and its vector chunks.

    Database chunk deletion is handled through the document foreign key
    cascade.
    """
    return await DocumentService(
        session
    ).delete_document(
        current_user=current_user,
        document_id=document_id,
    )