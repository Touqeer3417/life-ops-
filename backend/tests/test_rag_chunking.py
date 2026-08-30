from app.rag.parsers import (
    ParsedDocument,
    ParsedSection,
    parse_document,
)
from app.rag.text import (
    chunk_document,
)


def test_markdown_heading_hierarchy_is_preserved():
    markdown = b"""
# Employee Handbook

General employee information.

## Leave Policy

Employees should review the leave rules.

### Annual Leave

Employees receive annual leave according to policy.
"""

    parsed = parse_document(
        file_bytes=markdown,
        filename="handbook.md",
        extension=".md",
    )

    annual_leave_sections = [
        section
        for section
        in parsed.sections
        if (
            "annual leave"
            in section.text.lower()
        )
    ]

    assert annual_leave_sections

    section = (
        annual_leave_sections[0]
    )

    assert (
        section.section_path
        ==
        (
            "Employee Handbook",
            "Leave Policy",
            "Annual Leave",
        )
    )

    assert (
        section.title
        == "Annual Leave"
    )


def test_markdown_table_preserves_headers():
    markdown = b"""
# Employees

| Name | Department | Role |
| --- | --- | --- |
| Ali | Engineering | Developer |
| Sara | Finance | Analyst |
"""

    parsed = parse_document(
        file_bytes=markdown,
        filename="employees.md",
        extension=".md",
    )

    table_sections = [
        section
        for section
        in parsed.sections
        if (
            section.content_type
            == "table"
        )
    ]

    assert len(
        table_sections
    ) == 1

    table = (
        table_sections[0]
    )

    assert (
        table.metadata[
            "table_headers"
        ]
        ==
        [
            "Name",
            "Department",
            "Role",
        ]
    )

    assert (
        "Name: Ali"
        in table.text
    )

    assert (
        "Department: Engineering"
        in table.text
    )

    assert (
        "Role: Developer"
        in table.text
    )


def test_parent_child_metadata_is_created():
    parsed = ParsedDocument(
        sections=[
            ParsedSection(
                text=(
                    "Employees receive twenty "
                    "days of annual leave. "
                    "Leave requests must be "
                    "submitted through the HR "
                    "system before the requested "
                    "leave date."
                ),
                title="Annual Leave",
                section_path=(
                    "Employee Handbook",
                    "Leave Policy",
                    "Annual Leave",
                ),
                content_type="prose",
            )
        ]
    )

    chunks = chunk_document(
        parsed_document=parsed,
        filename="handbook.txt",
        chunk_size=100,
        chunk_overlap=20,
        parent_chunk_size=300,
        parent_chunk_overlap=30,
        table_parent_max_rows=20,
    )

    assert chunks

    for chunk in chunks:
        metadata = (
            chunk.metadata
        )

        assert (
            metadata.get(
                "parent_id"
            )
        )

        assert (
            metadata.get(
                "parent_content"
            )
        )

        assert (
            metadata.get(
                "section_title"
            )
            == "Annual Leave"
        )

        assert (
            metadata.get(
                "section_path"
            )
            ==
            [
                "Employee Handbook",
                "Leave Policy",
                "Annual Leave",
            ]
        )

        assert (
            metadata.get(
                "content_type"
            )
            == "prose"
        )


def test_child_embedding_text_contains_section_context():
    parsed = ParsedDocument(
        sections=[
            ParsedSection(
                text=(
                    "Employees receive annual "
                    "leave according to their "
                    "employment agreement."
                ),
                title="Annual Leave",
                section_path=(
                    "Policies",
                    "Leave",
                    "Annual Leave",
                ),
            )
        ]
    )

    chunks = chunk_document(
        parsed_document=parsed,
        filename="policy.txt",
        chunk_size=100,
        chunk_overlap=10,
        parent_chunk_size=300,
        parent_chunk_overlap=20,
        table_parent_max_rows=20,
    )

    assert chunks

    assert (
        "Policies > Leave > Annual Leave"
        in chunks[0].content
    )


def test_parent_is_larger_than_child_retrieval_unit():
    text = " ".join(
        [
            (
                "The company provides detailed "
                "employment policies covering "
                "annual leave and employee "
                "responsibilities."
            )
            for _ in range(20)
        ]
    )

    parsed = ParsedDocument(
        sections=[
            ParsedSection(
                text=text,
                title="Leave Policy",
                section_path=(
                    "Handbook",
                    "Leave Policy",
                ),
            )
        ]
    )

    chunks = chunk_document(
        parsed_document=parsed,
        filename="handbook.txt",
        chunk_size=200,
        chunk_overlap=30,
        parent_chunk_size=700,
        parent_chunk_overlap=80,
        table_parent_max_rows=20,
    )

    assert len(chunks) > 1

    assert all(
        isinstance(
            chunk.metadata.get(
                "parent_content"
            ),
            str,
        )
        for chunk
        in chunks
    )

    assert any(
        len(
            str(
                chunk.metadata[
                    "parent_content"
                ]
            )
        )
        >
        len(
            chunk.content
        )
        for chunk
        in chunks
    )


def test_table_parent_chunks_keep_column_information():
    parsed = ParsedDocument(
        sections=[
            ParsedSection(
                text=(
                    "Table columns: Name | Department\n"
                    "Row 1: Name: Ali | "
                    "Department: Engineering\n"
                    "Row 2: Name: Sara | "
                    "Department: Finance\n"
                    "Row 3: Name: Ahmed | "
                    "Department: Operations\n"
                    "Row 4: Name: Zain | "
                    "Department: Marketing"
                ),
                title="Employees",
                section_path=(
                    "Company",
                    "Employees",
                ),
                content_type="table",
                metadata={
                    "table_headers": [
                        "Name",
                        "Department",
                    ],
                    "table_row_count": 4,
                },
            )
        ]
    )

    chunks = chunk_document(
        parsed_document=parsed,
        filename="employees.md",
        chunk_size=160,
        chunk_overlap=20,
        parent_chunk_size=300,
        parent_chunk_overlap=20,
        table_parent_max_rows=2,
    )

    assert chunks

    for chunk in chunks:
        assert (
            chunk.metadata[
                "content_type"
            ]
            == "table"
        )

        assert (
            chunk.metadata[
                "table_headers"
            ]
            ==
            [
                "Name",
                "Department",
            ]
        )

        assert (
            "Name"
            in chunk.content
        )

        assert (
            "Department"
            in chunk.content
        )