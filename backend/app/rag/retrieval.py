from __future__ import annotations

import uuid
from dataclasses import (
    dataclass,
    replace,
)

from app.core.config import (
    Settings,
    get_settings,
)
from app.rag.providers import (
    EmbeddingProvider,
    LLMProvider,
)
from app.rag.query_rewriter import (
    QueryRewriteResult,
    QueryRewriter,
)
from app.rag.reranker import (
    CrossEncoderReranker,
)
from app.repositories.document_repository import (
    DocumentRepository,
    RetrievedChunk,
)


@dataclass(
    frozen=True,
    slots=True,
)
class AdvancedRetrievalResult:
    """
    Final output of advanced child-chunk retrieval.
    """

    chunks: list[
        RetrievedChunk
    ]

    rewrite: QueryRewriteResult


class AdvancedRetriever:
    """
    LifeOps advanced retrieval pipeline.

    query
        ↓
    rewrite + expansion + HyDE
        ↓
    multi-query dense retrieval
        ↓
    deduplication
        ↓
    strongest vector candidates
        ↓
    CrossEncoder reranking
        ↓
    threshold filtering
        ↓
    reranked CHILD chunks

    Parent expansion intentionally happens separately so
    both RAG chat and /documents/search can reuse it.
    """

    def __init__(
        self,
        *,
        repository: DocumentRepository,
        embedding_provider: EmbeddingProvider,
        llm_provider: LLMProvider,
        settings: Settings | None = None,
    ) -> None:
        self.settings = (
            settings
            or get_settings()
        )

        self.repository = repository

        self.embedding_provider = (
            embedding_provider
        )

        self.query_rewriter = (
            QueryRewriter(
                llm_provider=(
                    llm_provider
                ),
                settings=(
                    self.settings
                ),
            )
        )

        self.reranker = (
            CrossEncoderReranker(
                settings=(
                    self.settings
                )
            )
        )

    async def retrieve(
        self,
        *,
        user_id: uuid.UUID,
        question: str,
        top_k: int | None = None,
    ) -> AdvancedRetrievalResult:
        normalized_question = (
            " ".join(
                question.split()
            )
        )

        if not normalized_question:
            return AdvancedRetrievalResult(
                chunks=[],
                rewrite=(
                    QueryRewriteResult(
                        original_query="",
                        search_queries=(),
                        hyde_document=None,
                    )
                ),
            )

        rewrite = (
            await self.query_rewriter
            .rewrite(
                normalized_question
            )
        )

        retrieval_texts = (
            rewrite.retrieval_texts
        )

        if not retrieval_texts:
            retrieval_texts = (
                normalized_question,
            )

        candidates = (
            await self._collect_candidates(
                user_id=user_id,
                retrieval_texts=(
                    retrieval_texts
                ),
            )
        )

        if not candidates:
            return AdvancedRetrievalResult(
                chunks=[],
                rewrite=rewrite,
            )

        final_top_k = (
            top_k
            if top_k is not None
            else (
                self.settings
                .retrieval_top_k
            )
        )

        if final_top_k <= 0:
            return AdvancedRetrievalResult(
                chunks=[],
                rewrite=rewrite,
            )

        # Dense similarity is used only to reduce the pool
        # before expensive cross-encoder inference.
        candidates.sort(
            key=lambda chunk: (
                chunk.similarity
            ),
            reverse=True,
        )

        candidate_limit = min(
            len(candidates),
            self.settings
            .reranker_candidate_limit,
        )

        candidates = candidates[
            :candidate_limit
        ]

        if not (
            self.settings
            .reranker_enabled
        ):
            return AdvancedRetrievalResult(
                chunks=(
                    candidates[
                        :final_top_k
                    ]
                ),
                rewrite=rewrite,
            )

        reranked = (
            await self.reranker
            .rerank(
                query=(
                    normalized_question
                ),
                documents=[
                    chunk.content
                    for chunk
                    in candidates
                ],
                top_n=(
                    final_top_k
                ),
            )
        )

        if not reranked:
            return AdvancedRetrievalResult(
                chunks=[],
                rewrite=rewrite,
            )

        final_chunks: list[
            RetrievedChunk
        ] = []

        for result in reranked:
            if not (
                0
                <= result.index
                < len(candidates)
            ):
                continue

            candidate = (
                candidates[
                    result.index
                ]
            )

            final_chunks.append(
                replace(
                    candidate,
                    rerank_score=(
                        result.score
                    ),
                )
            )

        return AdvancedRetrievalResult(
            chunks=final_chunks,
            rewrite=rewrite,
        )

    async def _collect_candidates(
        self,
        *,
        user_id: uuid.UUID,
        retrieval_texts: tuple[
            str,
            ...,
        ],
    ) -> list[
        RetrievedChunk
    ]:
        """
        Retrieve candidates for every representation.

        Database calls intentionally remain sequential because
        one SQLAlchemy AsyncSession must not be used for
        concurrent DB operations.
        """

        best_by_chunk_id: dict[
            uuid.UUID,
            RetrievedChunk,
        ] = {}

        for retrieval_text in (
            retrieval_texts
        ):
            normalized_text = (
                " ".join(
                    retrieval_text.split()
                )
            )

            if not normalized_text:
                continue

            embedding = (
                await self
                .embedding_provider
                .embed_query(
                    normalized_text
                )
            )

            retrieved = (
                await self.repository
                .semantic_search(
                    user_id=user_id,
                    query_embedding=(
                        embedding
                    ),
                    top_k=(
                        self.settings
                        .retrieval_candidate_k
                    ),
                    similarity_threshold=(
                        self.settings
                        .retrieval_similarity_threshold
                    ),
                )
            )

            for chunk in retrieved:
                existing = (
                    best_by_chunk_id
                    .get(
                        chunk.chunk_id
                    )
                )

                if existing is None:
                    best_by_chunk_id[
                        chunk.chunk_id
                    ] = chunk

                    continue

                if (
                    chunk.similarity
                    >
                    existing.similarity
                ):
                    best_by_chunk_id[
                        chunk.chunk_id
                    ] = chunk

        return list(
            best_by_chunk_id.values()
        )


def expand_parent_chunks(
    retrieved_chunks: list[
        RetrievedChunk
    ],
    *,
    limit: int,
) -> list[
    RetrievedChunk
]:
    """
    Convert reranked child chunks into larger parent chunks.

    The input must already be ordered by relevance.

    Example:

        child 4 ─┐
        child 9 ─┼─ parent A
        child 11 ┘

        child 20 ── parent B

    becomes:

        parent A
        parent B

    Only the highest-ranked child represents each parent.

    Old chunks without parent metadata remain supported.
    """

    if limit <= 0:
        return []

    expanded: list[
        RetrievedChunk
    ] = []

    seen: set[
        tuple[
            uuid.UUID,
            str,
        ]
    ] = set()

    for chunk in retrieved_chunks:
        metadata = (
            chunk.metadata
            if isinstance(
                chunk.metadata,
                dict,
            )
            else {}
        )

        raw_parent_id = (
            metadata.get(
                "parent_id"
            )
        )

        if isinstance(
            raw_parent_id,
            str,
        ):
            parent_id = (
                raw_parent_id.strip()
            )

        elif raw_parent_id is not None:
            parent_id = (
                str(
                    raw_parent_id
                )
                .strip()
            )

        else:
            parent_id = ""

        if not parent_id:
            parent_id = (
                f"legacy-child:"
                f"{chunk.chunk_id}"
            )

        parent_key = (
            chunk.document_id,
            parent_id,
        )

        if parent_key in seen:
            continue

        raw_parent_content = (
            metadata.get(
                "parent_content"
            )
        )

        parent_content = (
            raw_parent_content.strip()
            if isinstance(
                raw_parent_content,
                str,
            )
            else ""
        )

        if not parent_content:
            parent_content = (
                chunk.content.strip()
            )

        if not parent_content:
            continue

        seen.add(
            parent_key
        )

        expanded.append(
            replace(
                chunk,
                content=(
                    parent_content
                ),
            )
        )

        if len(expanded) >= limit:
            break

    return expanded