import uuid

from app.rag.query_rewriter import (
    QueryRewriteResult,
)
from app.rag.retrieval import (
    expand_parent_chunks,
)
from app.repositories.document_repository import (
    RetrievedChunk,
)


def make_chunk(
    *,
    content: str,
    document_id: uuid.UUID | None = None,
    chunk_index: int = 0,
    parent_id: str | None = None,
    parent_content: str | None = None,
    section_path: list[str] | None = None,
    similarity: float = 0.80,
    rerank_score: float | None = 0.90,
) -> RetrievedChunk:
    resolved_document_id = (
        document_id
        or uuid.uuid4()
    )

    metadata: dict[
        str,
        object,
    ] = {}

    if parent_id is not None:
        metadata[
            "parent_id"
        ] = parent_id

    if parent_content is not None:
        metadata[
            "parent_content"
        ] = parent_content

    if section_path is not None:
        metadata[
            "section_path"
        ] = section_path

    return RetrievedChunk(
        chunk_id=(
            uuid.uuid4()
        ),
        document_id=(
            resolved_document_id
        ),
        filename="test.pdf",
        chunk_index=(
            chunk_index
        ),
        content=content,
        page_number=1,
        source="test.pdf",
        similarity=similarity,
        metadata=metadata,
        rerank_score=(
            rerank_score
        ),
    )


# =========================================================
# Query expansion
# =========================================================


def test_retrieval_texts_include_original_variants_and_hyde():
    rewrite = QueryRewriteResult(
        original_query=(
            "What is the annual leave policy?"
        ),
        search_queries=(
            "What is the annual leave policy?",
            (
                "employee annual leave "
                "entitlement"
            ),
            (
                "annual vacation allowance"
            ),
        ),
        hyde_document=(
            "Employees receive an annual "
            "paid leave entitlement."
        ),
    )

    texts = (
        rewrite.retrieval_texts
    )

    assert len(texts) == 4

    assert (
        "What is the annual leave policy?"
        in texts
    )

    assert (
        "employee annual leave entitlement"
        in texts
    )

    assert (
        "annual vacation allowance"
        in texts
    )

    assert (
        "Employees receive an annual "
        "paid leave entitlement."
        in texts
    )


def test_query_expansion_deduplicates_case_insensitively():
    rewrite = QueryRewriteResult(
        original_query="Annual Leave",
        search_queries=(
            "Annual Leave",
            "annual leave",
            "  Annual   Leave  ",
            "vacation entitlement",
        ),
        hyde_document=None,
    )

    assert (
        rewrite.retrieval_texts
        ==
        (
            "Annual Leave",
            "vacation entitlement",
        )
    )


def test_hyde_duplicate_is_not_added_twice():
    rewrite = QueryRewriteResult(
        original_query="Annual Leave",
        search_queries=(
            "Annual Leave",
            "Vacation entitlement",
        ),
        hyde_document=(
            "vacation entitlement"
        ),
    )

    assert (
        rewrite.retrieval_texts
        ==
        (
            "Annual Leave",
            "Vacation entitlement",
        )
    )


def test_empty_hyde_is_ignored():
    rewrite = QueryRewriteResult(
        original_query="Annual Leave",
        search_queries=(
            "Annual Leave",
        ),
        hyde_document="   ",
    )

    assert (
        rewrite.retrieval_texts
        ==
        (
            "Annual Leave",
        )
    )


# =========================================================
# Parent-child retrieval
# =========================================================


def test_children_from_same_parent_are_deduplicated():
    document_id = (
        uuid.uuid4()
    )

    first_child = make_chunk(
        document_id=document_id,
        content=(
            "Annual leave entitlement."
        ),
        parent_id="s1:p1",
        parent_content=(
            "Annual Leave Policy\n\n"
            "Employees receive annual leave. "
            "Requests must follow company policy."
        ),
        rerank_score=0.97,
    )

    second_child = make_chunk(
        document_id=document_id,
        content=(
            "Requests follow company policy."
        ),
        parent_id="s1:p1",
        parent_content=(
            "Annual Leave Policy\n\n"
            "Employees receive annual leave. "
            "Requests must follow company policy."
        ),
        rerank_score=0.88,
    )

    results = (
        expand_parent_chunks(
            [
                first_child,
                second_child,
            ],
            limit=5,
        )
    )

    assert len(results) == 1

    assert (
        results[0].chunk_id
        == first_child.chunk_id
    )

    assert results[0].content == (
        "Annual Leave Policy\n\n"
        "Employees receive annual leave. "
        "Requests must follow company policy."
    )


def test_highest_reranked_child_represents_parent():
    document_id = (
        uuid.uuid4()
    )

    strongest = make_chunk(
        document_id=document_id,
        content="Strong child",
        parent_id="parent-a",
        parent_content=(
            "Complete parent A"
        ),
        similarity=0.70,
        rerank_score=0.98,
    )

    weaker = make_chunk(
        document_id=document_id,
        content="Weaker child",
        parent_id="parent-a",
        parent_content=(
            "Complete parent A"
        ),
        similarity=0.94,
        rerank_score=0.65,
    )

    # Input represents AdvancedRetriever's reranker order.
    results = (
        expand_parent_chunks(
            [
                strongest,
                weaker,
            ],
            limit=5,
        )
    )

    assert len(results) == 1

    assert (
        results[0].chunk_id
        == strongest.chunk_id
    )

    assert (
        results[0].rerank_score
        == 0.98
    )


def test_identical_parent_ids_in_different_documents_remain_separate():
    first = make_chunk(
        document_id=(
            uuid.uuid4()
        ),
        content="Child A",
        parent_id="s0:p0",
        parent_content=(
            "Parent from document A"
        ),
    )

    second = make_chunk(
        document_id=(
            uuid.uuid4()
        ),
        content="Child B",
        parent_id="s0:p0",
        parent_content=(
            "Parent from document B"
        ),
    )

    results = (
        expand_parent_chunks(
            [
                first,
                second,
            ],
            limit=5,
        )
    )

    assert len(results) == 2

    assert (
        results[0].content
        == "Parent from document A"
    )

    assert (
        results[1].content
        == "Parent from document B"
    )


def test_parent_expansion_preserves_retrieval_order():
    document_id = (
        uuid.uuid4()
    )

    first = make_chunk(
        document_id=document_id,
        parent_id="parent-a",
        parent_content="Parent A",
        content="Child A",
        rerank_score=0.95,
    )

    second = make_chunk(
        document_id=document_id,
        parent_id="parent-b",
        parent_content="Parent B",
        content="Child B",
        rerank_score=0.85,
    )

    third = make_chunk(
        document_id=document_id,
        parent_id="parent-c",
        parent_content="Parent C",
        content="Child C",
        rerank_score=0.75,
    )

    results = (
        expand_parent_chunks(
            [
                first,
                second,
                third,
            ],
            limit=3,
        )
    )

    assert [
        result.content
        for result in results
    ] == [
        "Parent A",
        "Parent B",
        "Parent C",
    ]


def test_parent_expansion_respects_limit():
    document_id = (
        uuid.uuid4()
    )

    chunks = [
        make_chunk(
            document_id=document_id,
            chunk_index=index,
            content=(
                f"Child {index}"
            ),
            parent_id=(
                f"parent-{index}"
            ),
            parent_content=(
                f"Parent {index}"
            ),
        )
        for index
        in range(10)
    ]

    results = (
        expand_parent_chunks(
            chunks,
            limit=3,
        )
    )

    assert len(results) == 3


def test_zero_limit_returns_no_parents():
    chunk = make_chunk(
        content="Child",
        parent_id="parent",
        parent_content="Parent",
    )

    assert (
        expand_parent_chunks(
            [chunk],
            limit=0,
        )
        == []
    )


# =========================================================
# Legacy-index compatibility
# =========================================================


def test_old_chunk_without_parent_metadata_remains_usable():
    legacy = make_chunk(
        content=(
            "Legacy indexed chunk content"
        ),
        parent_id=None,
        parent_content=None,
    )

    results = (
        expand_parent_chunks(
            [legacy],
            limit=5,
        )
    )

    assert len(results) == 1

    assert (
        results[0].content
        ==
        "Legacy indexed chunk content"
    )


def test_two_legacy_chunks_do_not_accidentally_deduplicate():
    document_id = (
        uuid.uuid4()
    )

    first = make_chunk(
        document_id=document_id,
        content="Legacy chunk one",
    )

    second = make_chunk(
        document_id=document_id,
        content="Legacy chunk two",
    )

    results = (
        expand_parent_chunks(
            [
                first,
                second,
            ],
            limit=5,
        )
    )

    assert len(results) == 2


def test_missing_parent_content_falls_back_to_child():
    chunk = make_chunk(
        content=(
            "Relevant child text"
        ),
        parent_id="parent-1",
        parent_content=None,
    )

    results = (
        expand_parent_chunks(
            [chunk],
            limit=5,
        )
    )

    assert len(results) == 1

    assert (
        results[0].content
        ==
        "Relevant child text"
    )