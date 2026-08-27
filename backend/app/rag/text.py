import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.exceptions import DocumentProcessingError
from app.rag.parsers import ParsedDocument


@dataclass(frozen=True, slots=True)
class PreparedChunk:
    chunk_index: int
    content: str
    page_number: int | None
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)


def clean_text(value: str) -> str:
    """Normalize extracted document text without destroying paragraph structure."""
    if not value:
        return ""

    text = unicodedata.normalize("NFKC", value)

    text = text.replace("\x00", "")
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    text = re.sub(
        r"[^\S\n]+",
        " ",
        text,
    )

    text = re.sub(
        r" *\n *",
        "\n",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


def chunk_document(
    *,
    parsed_document: ParsedDocument,
    filename: str,
    chunk_size: int,
    chunk_overlap: int,
) -> list[PreparedChunk]:
    if chunk_size <= 0:
        raise DocumentProcessingError(
            "Document chunk size must be greater than zero"
        )

    if chunk_overlap < 0:
        raise DocumentProcessingError(
            "Document chunk overlap cannot be negative"
        )

    if chunk_overlap >= chunk_size:
        raise DocumentProcessingError(
            "Document chunk overlap must be smaller than the chunk size"
        )

    normalized_filename = filename.strip()

    if not normalized_filename:
        raise DocumentProcessingError(
            "Document filename is required for chunking"
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=[
            "\n\n",
            "\n",
            ". ",
            "? ",
            "! ",
            "; ",
            ", ",
            " ",
            "",
        ],
        keep_separator=True,
        is_separator_regex=False,
    )

    prepared_chunks: list[PreparedChunk] = []
    next_chunk_index = 0

    for section_index, section in enumerate(
        parsed_document.sections
    ):
        cleaned_section = clean_text(
            section.text
        )

        if not cleaned_section:
            continue

        section_chunks = splitter.split_text(
            cleaned_section
        )

        for section_chunk_index, raw_chunk in enumerate(
            section_chunks
        ):
            chunk_content = clean_text(
                raw_chunk
            )

            if not chunk_content:
                continue

            metadata: dict[str, Any] = {
                "filename": normalized_filename,
                "section_index": section_index,
                "section_chunk_index": section_chunk_index,
                "chunk_index": next_chunk_index,
            }

            if section.page_number is not None:
                metadata["page_number"] = (
                    section.page_number
                )

            prepared_chunks.append(
                PreparedChunk(
                    chunk_index=next_chunk_index,
                    content=chunk_content,
                    page_number=section.page_number,
                    source=normalized_filename,
                    metadata=metadata,
                )
            )

            next_chunk_index += 1

    if not prepared_chunks:
        raise DocumentProcessingError(
            "The document did not produce any usable text chunks"
        )

    return prepared_chunks