from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from docx import Document as DocxDocument
from docx.opc.exceptions import PackageNotFoundError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.core.exceptions import (
    DocumentProcessingError,
    UnsupportedMediaTypeError,
)


@dataclass(frozen=True, slots=True)
class ParsedSection:
    text: str
    page_number: int | None = None


@dataclass(frozen=True, slots=True)
class ParsedDocument:
    sections: list[ParsedSection]

    @property
    def text(self) -> str:
        return "\n\n".join(
            section.text
            for section in self.sections
            if section.text.strip()
        )


def parse_document(
    *,
    file_bytes: bytes,
    filename: str,
    extension: str,
) -> ParsedDocument:
    normalized_extension = extension.strip().lower()

    if normalized_extension == ".pdf":
        parsed = _parse_pdf(file_bytes)

    elif normalized_extension == ".docx":
        parsed = _parse_docx(file_bytes)

    elif normalized_extension in {".txt", ".md"}:
        parsed = _parse_text(file_bytes)

    else:
        raise UnsupportedMediaTypeError(
            f"Files with the {normalized_extension or 'unknown'} "
            "extension are not supported"
        )

    if not parsed.sections or not parsed.text.strip():
        raise DocumentProcessingError(
            f"No readable text could be extracted from {filename}"
        )

    return parsed


def _parse_pdf(file_bytes: bytes) -> ParsedDocument:
    if not file_bytes:
        raise DocumentProcessingError(
            "The PDF file is empty"
        )

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except (PdfReadError, ValueError, TypeError, OSError) as exc:
        raise DocumentProcessingError(
            "The PDF file is corrupted or cannot be read"
        ) from exc
    except Exception as exc:
        raise DocumentProcessingError(
            "Unable to read the PDF file"
        ) from exc

    if reader.is_encrypted:
        try:
            decrypt_result = reader.decrypt("")
        except Exception as exc:
            raise DocumentProcessingError(
                "Encrypted PDF files requiring a password are not supported"
            ) from exc

        if decrypt_result == 0:
            raise DocumentProcessingError(
                "Encrypted PDF files requiring a password are not supported"
            )

    if not reader.pages:
        raise DocumentProcessingError(
            "The PDF file does not contain any pages"
        )

    sections: list[ParsedSection] = []

    for page_index, page in enumerate(reader.pages):
        try:
            extracted = page.extract_text()
        except Exception as exc:
            raise DocumentProcessingError(
                f"Unable to extract text from PDF page {page_index + 1}"
            ) from exc

        text = extracted.strip() if extracted else ""

        if not text:
            continue

        sections.append(
            ParsedSection(
                text=text,
                page_number=page_index + 1,
            )
        )

    if not sections:
        raise DocumentProcessingError(
            "The PDF does not contain extractable text"
        )

    return ParsedDocument(
        sections=sections
    )


def _parse_docx(file_bytes: bytes) -> ParsedDocument:
    if not file_bytes:
        raise DocumentProcessingError(
            "The DOCX file is empty"
        )

    try:
        document = DocxDocument(BytesIO(file_bytes))
    except (
        PackageNotFoundError,
        ValueError,
        KeyError,
        TypeError,
        OSError,
    ) as exc:
        raise DocumentProcessingError(
            "The DOCX file is corrupted or cannot be read"
        ) from exc
    except Exception as exc:
        raise DocumentProcessingError(
            "Unable to read the DOCX file"
        ) from exc

    content_blocks: list[str] = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            content_blocks.append(text)

    for table in document.tables:
        for row in table.rows:
            cells = [
                cell.text.strip()
                for cell in row.cells
                if cell.text.strip()
            ]

            if cells:
                content_blocks.append(
                    " | ".join(cells)
                )

    if not content_blocks:
        raise DocumentProcessingError(
            "The DOCX file does not contain readable text"
        )

    return ParsedDocument(
        sections=[
            ParsedSection(
                text="\n\n".join(content_blocks),
                page_number=None,
            )
        ]
    )


def _parse_text(file_bytes: bytes) -> ParsedDocument:
    if not file_bytes:
        raise DocumentProcessingError(
            "The text file is empty"
        )

    decoded = _decode_text(file_bytes)
    normalized = decoded.strip()

    if not normalized:
        raise DocumentProcessingError(
            "The text file does not contain readable text"
        )

    return ParsedDocument(
        sections=[
            ParsedSection(
                text=normalized,
                page_number=None,
            )
        ]
    )


def _decode_text(file_bytes: bytes) -> str:
    encodings = (
        "utf-8-sig",
        "utf-8",
        "utf-16",
    )

    for encoding in encodings:
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue

    raise DocumentProcessingError(
        "The text file uses an unsupported character encoding"
    )


def get_extension(filename: str) -> str:
    return Path(filename).suffix.lower()