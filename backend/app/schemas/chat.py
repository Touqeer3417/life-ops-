import uuid

from pydantic import BaseModel, Field, field_validator


class RagChatRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=4000,
    )

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        normalized = " ".join(value.split())

        if not normalized:
            raise ValueError("Question cannot be empty")

        return normalized


class RagCitation(BaseModel):
    document_id: uuid.UUID
    chunk_id: uuid.UUID
    filename: str
    chunk_index: int
    page_number: int | None
    source: str | None
    similarity: float
    excerpt: str


class RagChatResponse(BaseModel):
    answer: str
    citations: list[RagCitation]
    context_found: bool