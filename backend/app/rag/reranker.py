from __future__ import annotations

import asyncio
from dataclasses import dataclass
from functools import lru_cache
from typing import Sequence

import torch
from sentence_transformers import (
    CrossEncoder,
)

from app.core.config import (
    Settings,
    get_settings,
)
from app.core.exceptions import (
    UpstreamServiceError,
)


@dataclass(
    frozen=True,
    slots=True,
)
class RerankResult:
    """
    Score assigned to one candidate document.

    index:
        Original index of the document passed into rerank().

    score:
        Normalized CrossEncoder relevance score from 0.0
        to 1.0.
    """

    index: int
    score: float


class CrossEncoderReranker:
    """
    Second-stage neural reranker.

    Vector retrieval is intentionally optimized for recall.
    This CrossEncoder is responsible for precision.

    Pipeline:

        query
            +
        candidate document
            ↓
        CrossEncoder
            ↓
        relevance score
            ↓
        threshold
            ↓
        top-N
    """

    def __init__(
        self,
        settings: Settings | None = None,
    ) -> None:
        self.settings = (
            settings
            or get_settings()
        )

        # Prevent one application instance from running
        # multiple expensive predictions simultaneously
        # through this reranker object.
        self._inference_lock = (
            asyncio.Lock()
        )

    @property
    def model(
        self,
    ) -> CrossEncoder:
        """
        Lazily load the reranker.

        This is important because model loading is expensive
        and should not happen during module import.
        """

        try:
            return _load_cross_encoder(
                model_name=(
                    self.settings
                    .reranker_model
                ),
                max_length=(
                    self.settings
                    .reranker_max_length
                ),
                device=(
                    self.settings
                    .reranker_resolved_device
                ),
            )

        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to load the document "
                "reranking model"
            ) from exc

    async def rerank(
        self,
        *,
        query: str,
        documents: Sequence[str],
        top_n: int | None = None,
    ) -> list[RerankResult]:
        """
        Rerank candidate documents against the original
        user query.

        Empty documents are ignored while their original
        indexes are preserved.

        Results below RERANKER_SCORE_THRESHOLD are removed.
        """

        normalized_query = (
            " ".join(
                query.split()
            )
        )

        if not normalized_query:
            return []

        if not documents:
            return []

        final_top_n = (
            top_n
            if top_n is not None
            else self.settings.retrieval_top_k
        )

        if final_top_n <= 0:
            return []

        candidates: list[
            tuple[int, str]
        ] = []

        for index, document in enumerate(
            documents
        ):
            normalized_document = (
                document.strip()
            )

            if not normalized_document:
                continue

            candidates.append(
                (
                    index,
                    normalized_document,
                )
            )

        if not candidates:
            return []

        # Query-document pairs are what make a
        # CrossEncoder different from embedding similarity.
        pairs = [
            (
                normalized_query,
                document,
            )
            for _, document
            in candidates
        ]

        try:
            async with (
                self._inference_lock
            ):
                raw_scores = (
                    await asyncio.to_thread(
                        self._predict,
                        pairs,
                    )
                )

        except UpstreamServiceError:
            raise

        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to rerank retrieved "
                "document chunks"
            ) from exc

        if (
            len(raw_scores)
            != len(candidates)
        ):
            raise UpstreamServiceError(
                "Reranker returned an unexpected "
                "number of relevance scores"
            )

        scored: list[
            RerankResult
        ] = []

        threshold = (
            self.settings
            .reranker_score_threshold
        )

        for (
            candidate,
            score,
        ) in zip(
            candidates,
            raw_scores,
            strict=True,
        ):
            original_index, _ = (
                candidate
            )

            normalized_score = (
                self._normalize_score(
                    score
                )
            )

            # Explicit second-pass relevance filter.
            #
            # A weak embedding candidate should not
            # reach the LLM merely because it happened
            # to be semantically nearby.
            if (
                normalized_score
                < threshold
            ):
                continue

            scored.append(
                RerankResult(
                    index=(
                        original_index
                    ),
                    score=(
                        normalized_score
                    ),
                )
            )

        scored.sort(
            key=lambda result: (
                result.score
            ),
            reverse=True,
        )

        return scored[
            :final_top_n
        ]

    def _predict(
        self,
        pairs: Sequence[
            tuple[str, str]
        ],
    ) -> list[float]:
        """
        Synchronous model inference.

        Called inside asyncio.to_thread() so PyTorch does
        not block FastAPI's event loop.
        """

        if not pairs:
            return []

        try:
            predictions = (
                self.model.predict(
                    list(pairs),
                    batch_size=(
                        self.settings
                        .reranker_batch_size
                    ),
                    show_progress_bar=False,
                    convert_to_numpy=True,
                )
            )

        except Exception as exc:
            raise UpstreamServiceError(
                "CrossEncoder inference failed"
            ) from exc

        scores: list[float] = []

        for prediction in predictions:
            # numpy scalar / torch scalar
            if hasattr(
                prediction,
                "item",
            ):
                try:
                    value = float(
                        prediction.item()
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    value = float(
                        prediction
                    )
            else:
                value = float(
                    prediction
                )

            scores.append(
                value
            )

        return scores

    @staticmethod
    def _normalize_score(
        score: float,
    ) -> float:
        """
        CrossEncoder is configured with Sigmoid, therefore
        scores should already be within 0..1.

        Clamp defensively against floating-point/provider
        edge cases.
        """

        return max(
            0.0,
            min(
                1.0,
                float(score),
            ),
        )


@lru_cache(
    maxsize=4
)
def _load_cross_encoder(
    *,
    model_name: str,
    max_length: int,
    device: str | None,
) -> CrossEncoder:
    """
    Process-wide cached model loader.

    Without this cache, every RagService request could
    potentially allocate another copy of the model in RAM.
    """

    normalized_model = (
        model_name.strip()
    )

    if not normalized_model:
        raise ValueError(
            "Reranker model name "
            "cannot be empty"
        )

    return CrossEncoder(
        normalized_model,
        max_length=max_length,
        device=device,

        # Gives interpretable 0..1 relevance scores and
        # allows an explicit RERANKER_SCORE_THRESHOLD.
        activation_fn=(
            torch.nn.Sigmoid()
        ),
    )