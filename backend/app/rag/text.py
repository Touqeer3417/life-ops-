from __future__ import annotations

import re
import unicodedata
from dataclasses import (
    dataclass,
    field,
)
from typing import Any

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)

from app.core.exceptions import (
    DocumentProcessingError,
)
from app.rag.parsers import (
    ParsedDocument,
    ParsedSection,
)


@dataclass(
    frozen=True,
    slots=True,
)
class PreparedChunk:
    chunk_index: int

    # Small child content embedded into pgvector.
    content: str

    page_number: int | None

    source: str

    metadata: dict[
        str,
        Any,
    ] = field(
        default_factory=dict
    )


@dataclass(
    frozen=True,
    slots=True,
)
class ParentChunk:
    parent_id: str

    parent_index: int

    content: str

    page_number: int | None

    section_index: int

    section_title: str | None

    section_path: tuple[
        str,
        ...,
    ]

    content_type: str

    metadata: dict[
        str,
        Any,
    ]


def clean_text(
    value: str,
) -> str:
    """
    Normalize extracted document text while preserving
    paragraph and row boundaries.
    """

    if not value:
        return ""

    text = unicodedata.normalize(
        "NFKC",
        value,
    )

    text = text.replace(
        "\x00",
        "",
    )

    text = text.replace(
        "\r\n",
        "\n",
    )

    text = text.replace(
        "\r",
        "\n",
    )

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
    parent_chunk_size: int,
    parent_chunk_overlap: int,
    table_parent_max_rows: int,
) -> list[
    PreparedChunk
]:
    _validate_chunk_configuration(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        parent_chunk_size=(
            parent_chunk_size
        ),
        parent_chunk_overlap=(
            parent_chunk_overlap
        ),
        table_parent_max_rows=(
            table_parent_max_rows
        ),
    )

    normalized_filename = (
        filename.strip()
    )

    if not normalized_filename:
        raise DocumentProcessingError(
            "Document filename is required "
            "for chunking"
        )

    parents = _build_parent_chunks(
        parsed_document=(
            parsed_document
        ),
        parent_chunk_size=(
            parent_chunk_size
        ),
        parent_chunk_overlap=(
            parent_chunk_overlap
        ),
        table_parent_max_rows=(
            table_parent_max_rows
        ),
    )

    if not parents:
        raise DocumentProcessingError(
            "The document did not produce "
            "any usable parent chunks"
        )

    child_splitter = (
        RecursiveCharacterTextSplitter(
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
                " ",
                "",
            ],
            keep_separator=True,
            is_separator_regex=False,
        )
    )

    prepared_chunks: list[
        PreparedChunk
    ] = []

    next_chunk_index = 0

    for parent in parents:
        child_source_text = (
            _without_repeated_heading(
                parent.content,
                parent.section_path,
            )
        )

        if (
            parent.content_type
            == "table"
        ):
            child_texts = (
                _split_table_children(
                    text=child_source_text,
                    chunk_size=chunk_size,
                    splitter=child_splitter,
                )
            )

        else:
            child_texts = (
                child_splitter
                .split_text(
                    child_source_text
                )
            )

        for (
            child_index,
            raw_child,
        ) in enumerate(
            child_texts
        ):
            child = clean_text(
                raw_child
            )

            if not child:
                continue

            # Add document hierarchy directly to embedding
            # text so semantically identical paragraphs
            # from different sections remain distinguishable.
            retrieval_content = (
                _with_section_context(
                    text=child,
                    section_path=(
                        parent.section_path
                    ),
                )
            )

            metadata: dict[
                str,
                Any,
            ] = {
                "filename": (
                    normalized_filename
                ),
                "chunk_index": (
                    next_chunk_index
                ),
                "child_index": (
                    child_index
                ),
                "parent_id": (
                    parent.parent_id
                ),
                "parent_index": (
                    parent.parent_index
                ),
                "parent_content": (
                    parent.content
                ),
                "section_index": (
                    parent.section_index
                ),
                "section_title": (
                    parent.section_title
                ),
                "section_path": list(
                    parent.section_path
                ),
                "content_type": (
                    parent.content_type
                ),
            }

            metadata.update(
                parent.metadata
            )

            if (
                parent.page_number
                is not None
            ):
                metadata[
                    "page_number"
                ] = parent.page_number

            prepared_chunks.append(
                PreparedChunk(
                    chunk_index=(
                        next_chunk_index
                    ),
                    content=(
                        retrieval_content
                    ),
                    page_number=(
                        parent.page_number
                    ),
                    source=(
                        normalized_filename
                    ),
                    metadata=(
                        metadata
                    ),
                )
            )

            next_chunk_index += 1

    if not prepared_chunks:
        raise DocumentProcessingError(
            "The document did not produce "
            "any usable text chunks"
        )

    return prepared_chunks


# =========================================================
# Parent chunks
# =========================================================


def _build_parent_chunks(
    *,
    parsed_document: ParsedDocument,
    parent_chunk_size: int,
    parent_chunk_overlap: int,
    table_parent_max_rows: int,
) -> list[
    ParentChunk
]:
    prose_splitter = (
        RecursiveCharacterTextSplitter(
            chunk_size=(
                parent_chunk_size
            ),
            chunk_overlap=(
                parent_chunk_overlap
            ),
            length_function=len,
            separators=[
                "\n\n",
                "\n",
                ". ",
                "? ",
                "! ",
                "; ",
                " ",
                "",
            ],
            keep_separator=True,
            is_separator_regex=False,
        )
    )

    parents: list[
        ParentChunk
    ] = []

    next_parent_index = 0

    for (
        section_index,
        section,
    ) in enumerate(
        parsed_document.sections
    ):
        cleaned = clean_text(
            section.text
        )

        if not cleaned:
            continue

        if (
            section.content_type
            == "table"
        ):
            section_parents = (
                _split_table_parents(
                    section=section,
                    text=cleaned,
                    max_chars=(
                        parent_chunk_size
                    ),
                    max_rows=(
                        table_parent_max_rows
                    ),
                )
            )

        else:
            section_parents = (
                prose_splitter
                .split_text(
                    cleaned
                )
            )

        for raw_parent in (
            section_parents
        ):
            parent_text = clean_text(
                raw_parent
            )

            if not parent_text:
                continue

            parent_text = (
                _with_section_context(
                    text=parent_text,
                    section_path=(
                        section.section_path
                    ),
                )
            )

            parent_id = (
                f"s{section_index}:"
                f"p{next_parent_index}"
            )

            metadata = dict(
                section.metadata
            )

            parents.append(
                ParentChunk(
                    parent_id=(
                        parent_id
                    ),
                    parent_index=(
                        next_parent_index
                    ),
                    content=(
                        parent_text
                    ),
                    page_number=(
                        section.page_number
                    ),
                    section_index=(
                        section_index
                    ),
                    section_title=(
                        section.title
                    ),
                    section_path=(
                        section.section_path
                    ),
                    content_type=(
                        section.content_type
                    ),
                    metadata=(
                        metadata
                    ),
                )
            )

            next_parent_index += 1

    return parents


# =========================================================
# Table handling
# =========================================================


def _split_table_parents(
    *,
    section: ParsedSection,
    text: str,
    max_chars: int,
    max_rows: int,
) -> list[str]:
    """
    Preserve table headers for every parent table chunk.

    Expected parser format:

        Table columns: Name | Department
        Row 1: Name: Ali | Department: Engineering
        Row 2: ...
    """

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    if not lines:
        return []

    header = lines[0]

    rows = (
        lines[1:]
        if len(lines) > 1
        else []
    )

    if not rows:
        return [
            text
        ]

    parents: list[str] = []

    current_rows: list[str] = []

    def flush() -> None:
        nonlocal current_rows

        if not current_rows:
            return

        parents.append(
            "\n".join(
                [
                    header,
                    *current_rows,
                ]
            )
        )

        current_rows = []

    for row in rows:
        tentative = "\n".join(
            [
                header,
                *current_rows,
                row,
            ]
        )

        exceeds_rows = (
            len(current_rows)
            >= max_rows
        )

        exceeds_chars = (
            len(tentative)
            > max_chars
            and bool(
                current_rows
            )
        )

        if (
            exceeds_rows
            or exceeds_chars
        ):
            flush()

        current_rows.append(
            row
        )

    flush()

    return (
        parents
        or [text]
    )


def _split_table_children(
    *,
    text: str,
    chunk_size: int,
    splitter: (
        RecursiveCharacterTextSplitter
    ),
) -> list[str]:
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    if not lines:
        return []

    header = lines[0]

    if len(lines) == 1:
        return [
            text
        ]

    rows = lines[1:]

    children: list[str] = []

    current_rows: list[str] = []

    def flush() -> None:
        nonlocal current_rows

        if not current_rows:
            return

        block = "\n".join(
            [
                header,
                *current_rows,
            ]
        )

        if len(block) <= chunk_size:
            children.append(
                block
            )

        else:
            children.extend(
                splitter.split_text(
                    block
                )
            )

        current_rows = []

    for row in rows:
        tentative = "\n".join(
            [
                header,
                *current_rows,
                row,
            ]
        )

        if (
            len(tentative)
            > chunk_size
            and current_rows
        ):
            flush()

        current_rows.append(
            row
        )

    flush()

    return (
        children
        or [text]
    )


# =========================================================
# Context helpers
# =========================================================


def _with_section_context(
    *,
    text: str,
    section_path: tuple[
        str,
        ...,
    ],
) -> str:
    clean_body = clean_text(
        text
    )

    hierarchy = [
        clean_text(
            value
        )
        for value
        in section_path
        if clean_text(
            value
        )
    ]

    if not hierarchy:
        return clean_body

    heading = (
        " > ".join(
            hierarchy
        )
    )

    if clean_body.startswith(
        heading
    ):
        return clean_body

    return (
        f"{heading}\n\n"
        f"{clean_body}"
    )


def _without_repeated_heading(
    text: str,
    section_path: tuple[
        str,
        ...,
    ],
) -> str:
    if not section_path:
        return text

    heading = (
        " > ".join(
            section_path
        )
    )

    normalized = (
        text.strip()
    )

    prefix = (
        f"{heading}\n\n"
    )

    if normalized.startswith(
        prefix
    ):
        return normalized[
            len(prefix):
        ]

    return normalized


# =========================================================
# Validation
# =========================================================


def _validate_chunk_configuration(
    *,
    chunk_size: int,
    chunk_overlap: int,
    parent_chunk_size: int,
    parent_chunk_overlap: int,
    table_parent_max_rows: int,
) -> None:
    if chunk_size <= 0:
        raise DocumentProcessingError(
            "Document chunk size must "
            "be greater than zero"
        )

    if chunk_overlap < 0:
        raise DocumentProcessingError(
            "Document chunk overlap "
            "cannot be negative"
        )

    if chunk_overlap >= chunk_size:
        raise DocumentProcessingError(
            "Document chunk overlap must "
            "be smaller than the chunk size"
        )

    if parent_chunk_size <= 0:
        raise DocumentProcessingError(
            "Parent chunk size must be "
            "greater than zero"
        )

    if (
        parent_chunk_overlap
        < 0
    ):
        raise DocumentProcessingError(
            "Parent chunk overlap "
            "cannot be negative"
        )

    if (
        parent_chunk_overlap
        >= parent_chunk_size
    ):
        raise DocumentProcessingError(
            "Parent chunk overlap must "
            "be smaller than parent "
            "chunk size"
        )

    if (
        parent_chunk_size
        <= chunk_size
    ):
        raise DocumentProcessingError(
            "Parent chunk size must be "
            "greater than child chunk size"
        )

    if table_parent_max_rows <= 0:
        raise DocumentProcessingError(
            "Table parent maximum rows "
            "must be greater than zero"
        )