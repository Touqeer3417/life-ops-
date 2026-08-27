import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.document import DocumentStatus


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_filename: str
    mime_type: str
    file_extension: str
    file_size: int
    status: str
    processing_error: str | None
    indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DocumentDetailRead(DocumentRead):
    chunk_count: int = 0


class DocumentListResponse(BaseModel):
    documents: list[DocumentRead]
    total: int


class DocumentUploadResponse(BaseModel):
    document: DocumentRead
    message: str


class DocumentDeleteResponse(BaseModel):
    id: uuid.UUID
    message: str


class DocumentSearchRequest(BaseModel):
    query: str = Field(
        min_length=1,
        max_length=2000,
    )
    top_k: int | None = Field(
        default=None,
        ge=1,
        le=50,
    )

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = " ".join(value.split())

        if not normalized:
            raise ValueError("Search query cannot be empty")

        return normalized


class DocumentSearchResult(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    chunk_index: int
    content: str
    page_number: int | None
    source: str | None
    similarity: float


class DocumentSearchResponse(BaseModel):
    query: str
    results: list[DocumentSearchResult]
    total: int


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    status: str
    processing_error: str | None
    indexed_at: datetime | None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {
            DocumentStatus.PROCESSING.value,
            DocumentStatus.INDEXED.value,
            DocumentStatus.FAILED.value,
        }

        if value not in allowed:
            raise ValueError("Invalid document status")

        return value