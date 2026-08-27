from collections.abc import Sequence
from typing import Any

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import Settings, get_settings
from app.core.exceptions import UpstreamServiceError


class EmbeddingProvider:
    def __init__(
        self,
        client: Embeddings,
        *,
        expected_dimension: int,
    ) -> None:
        self.client = client
        self.expected_dimension = expected_dimension

    async def embed_documents(
        self,
        texts: Sequence[str],
    ) -> list[list[float]]:
        normalized_texts = [
            text
            for text in texts
            if text.strip()
        ]

        if not normalized_texts:
            return []

        if len(normalized_texts) != len(texts):
            raise UpstreamServiceError(
                "Cannot generate embeddings for empty document chunks"
            )

        try:
            vectors = await self.client.aembed_documents(
                normalized_texts
            )
        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to generate document embeddings"
            ) from exc

        if len(vectors) != len(normalized_texts):
            raise UpstreamServiceError(
                "Embedding provider returned an unexpected number of vectors"
            )

        for vector in vectors:
            self._validate_vector(
                vector
            )

        return vectors

    async def embed_query(
        self,
        query: str,
    ) -> list[float]:
        normalized_query = query.strip()

        if not normalized_query:
            raise UpstreamServiceError(
                "Cannot generate an embedding for an empty query"
            )

        try:
            vector = await self.client.aembed_query(
                normalized_query
            )
        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to generate the query embedding"
            ) from exc

        self._validate_vector(
            vector
        )

        return vector

    def _validate_vector(
        self,
        vector: Sequence[float],
    ) -> None:
        if len(vector) != self.expected_dimension:
            raise UpstreamServiceError(
                "Embedding provider returned a vector with "
                "an unexpected dimension"
            )


class LLMProvider:
    def __init__(
        self,
        client: BaseChatModel,
    ) -> None:
        self.client = client

    async def generate(
        self,
        messages: Sequence[BaseMessage],
    ) -> str:
        if not messages:
            raise UpstreamServiceError(
                "Cannot generate a response without a prompt"
            )

        try:
            response = await self.client.ainvoke(
                list(messages)
            )
        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to generate the AI response"
            ) from exc

        answer = _extract_message_text(
            response.content
        )

        if not answer:
            raise UpstreamServiceError(
                "The language model returned an empty response"
            )

        return answer


def create_embedding_provider(
    settings: Settings | None = None,
) -> EmbeddingProvider:
    settings = settings or get_settings()

    api_key = (
        settings.embedding_api_key
        .get_secret_value()
        .strip()
    )

    if not api_key:
        raise RuntimeError(
            "Embedding provider API key is not configured"
        )

    if settings.embedding_provider == "openai":
        kwargs: dict[str, Any] = {
            "model": settings.embedding_model,
            "api_key": api_key,
            "max_retries": 2,
        }

        if settings.embedding_model.startswith(
            "text-embedding-3"
        ):
            kwargs["dimensions"] = (
                settings.embedding_dimension
            )

        client = OpenAIEmbeddings(
            **kwargs
        )

        return EmbeddingProvider(
            client,
            expected_dimension=(
                settings.embedding_dimension
            ),
        )

    raise RuntimeError(
        "Unsupported embedding provider: "
        f"{settings.embedding_provider}"
    )


def create_llm_provider(
    settings: Settings | None = None,
) -> LLMProvider:
    settings = settings or get_settings()

    api_key = (
        settings.llm_api_key
        .get_secret_value()
        .strip()
    )

    if not api_key:
        raise RuntimeError(
            "LLM provider API key is not configured"
        )

    if settings.llm_provider == "openai":
        client: BaseChatModel = ChatOpenAI(
            model=settings.llm_model,
            api_key=api_key,
            temperature=0,
            max_retries=2,
        )

        return LLMProvider(
            client
        )

    if settings.llm_provider == "groq":
        client = ChatGroq(
            model=settings.llm_model,
            api_key=api_key,
            temperature=0,
            max_retries=2,
        )

        return LLMProvider(
            client
        )

    raise RuntimeError(
        "Unsupported LLM provider: "
        f"{settings.llm_provider}"
    )


def _extract_message_text(
    content: Any,
) -> str:
    if isinstance(content, str):
        return content.strip()

    if not isinstance(content, list):
        return str(content).strip()

    text_parts: list[str] = []

    for block in content:
        if isinstance(block, str):
            if block.strip():
                text_parts.append(
                    block.strip()
                )
            continue

        if isinstance(block, dict):
            text = block.get("text")

            if isinstance(text, str) and text.strip():
                text_parts.append(
                    text.strip()
                )

    return "\n".join(
        text_parts
    ).strip()