import json
from datetime import (
    datetime,
)
from typing import Any
from zoneinfo import (
    ZoneInfo,
    ZoneInfoNotFoundError,
)

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    ToolMessage,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.agent.graph import (
    build_lifeops_agent_graph,
)
from app.core.config import (
    Settings,
    get_settings,
)
from app.core.exceptions import (
    UpstreamServiceError,
)
from app.models.user import User
from app.schemas.chat import (
    RagChatRequest,
    RagChatResponse,
    RagCitation,
)


class AgentService:
    """
    Application service for the LifeOps AI agent.

    Responsibilities:
    - determine the authenticated user's timezone;
    - inject the real runtime datetime;
    - construct the per-request user-scoped agent;
    - execute the LangGraph ReAct loop asynchronously;
    - collect document citations from tool observations;
    - preserve the existing /chat response contract.
    """

    def __init__(
        self,
        session: AsyncSession,
        settings: Settings | None = None,
    ) -> None:
        self.session = session

        self.settings = (
            settings
            or get_settings()
        )

    async def ask(
        self,
        *,
        current_user: User,
        payload: RagChatRequest,
    ) -> RagChatResponse:
        """
        Run one LifeOps agent request.

        current_user originates from FastAPI authentication
        dependencies. It is never selected by the model.
        """

        timezone_name = (
            self._resolve_user_timezone(
                current_user
            )
        )

        runtime_now = (
            datetime.now(
                ZoneInfo(
                    timezone_name
                )
            )
        )

        graph = (
            build_lifeops_agent_graph(
                current_user=(
                    current_user
                ),
                session=self.session,
                settings=self.settings,
                runtime_now=(
                    runtime_now
                ),
                timezone_name=(
                    timezone_name
                ),
            )
        )

        try:
            result = await graph.ainvoke(
                {
                    "messages": [
                        HumanMessage(
                            content=(
                                payload.question
                            )
                        )
                    ]
                },
                config={
                    "recursion_limit": 16,
                    "max_concurrency": 1,
                },
            )
        except UpstreamServiceError:
            raise
        except Exception as exc:
            raise UpstreamServiceError(
                "Unable to complete the "
                "LifeOps AI request"
            ) from exc

        messages = self._extract_messages(
            result
        )

        answer = (
            self._extract_final_answer(
                messages
            )
        )

        tool_context = (
            self._inspect_tool_results(
                messages
            )
        )

        return RagChatResponse(
            answer=answer,
            citations=(
                tool_context.citations
            ),
            context_found=(
                tool_context
                .legacy_context_found
            ),
        )

    @staticmethod
    def _resolve_user_timezone(
        current_user: User,
    ) -> str:
        """
        Resolve the same saved IANA timezone used by the
        existing Calendar architecture.

        UTC remains the safe fallback for users without a
        preference record.
        """

        timezone_name = "UTC"

        preferences = (
            current_user.preferences
        )

        if (
            preferences is not None
            and preferences.timezone
            and preferences.timezone.strip()
        ):
            timezone_name = (
                preferences
                .timezone
                .strip()
            )

        try:
            ZoneInfo(
                timezone_name
            )
        except ZoneInfoNotFoundError as exc:
            raise UpstreamServiceError(
                "The user's saved timezone "
                "is invalid"
            ) from exc

        return timezone_name

    @staticmethod
    def _extract_messages(
        result: Any,
    ) -> list[BaseMessage]:
        if not isinstance(
            result,
            dict,
        ):
            raise UpstreamServiceError(
                "The LifeOps agent returned "
                "an invalid result"
            )

        raw_messages = (
            result.get(
                "messages"
            )
        )

        if not isinstance(
            raw_messages,
            list,
        ):
            raise UpstreamServiceError(
                "The LifeOps agent returned "
                "an invalid message history"
            )

        messages = [
            message
            for message
            in raw_messages
            if isinstance(
                message,
                BaseMessage,
            )
        ]

        if not messages:
            raise UpstreamServiceError(
                "The LifeOps agent returned "
                "no messages"
            )

        return messages

    @classmethod
    def _extract_final_answer(
        cls,
        messages: list[
            BaseMessage
        ],
    ) -> str:
        """
        Find the final non-empty AI response.

        Tool-calling AI messages often have no user-visible
        content, so scanning backwards is safer than assuming
        every AIMessage is a final answer.
        """

        for message in reversed(
            messages
        ):
            if not isinstance(
                message,
                AIMessage,
            ):
                continue

            if message.tool_calls:
                continue

            text = (
                cls._message_text(
                    message.content
                )
            )

            if text:
                return text

        raise UpstreamServiceError(
            "The LifeOps agent returned "
            "an empty final response"
        )

    @classmethod
    def _inspect_tool_results(
        cls,
        messages: list[
            BaseMessage
        ],
    ) -> "AgentToolContext":
        """
        Extract document citation metadata from tool
        observations without exposing tool JSON to the
        frontend.

        context_found is retained only for backward
        compatibility with the existing Phase 2 response.
        """

        citations_by_chunk: dict[
            str,
            RagCitation,
        ] = {}

        document_search_performed = False
        document_context_found = False

        successful_non_document_tool = False

        for message in messages:
            if not isinstance(
                message,
                ToolMessage,
            ):
                continue

            payload = (
                cls._parse_tool_payload(
                    message
                )
            )

            if payload is None:
                continue

            tool_name = payload.get(
                "tool"
            )

            if (
                tool_name
                == "search_documents"
            ):
                document_search_performed = (
                    True
                )

                if (
                    payload.get("ok")
                    is True
                    and payload.get(
                        "context_found"
                    )
                    is True
                ):
                    document_context_found = (
                        True
                    )

                    cls._collect_citations(
                        payload=payload,
                        target=(
                            citations_by_chunk
                        ),
                    )

                continue

            if (
                isinstance(
                    tool_name,
                    str,
                )
                and payload.get("ok")
                is True
            ):
                successful_non_document_tool = (
                    True
                )

        citations = list(
            citations_by_chunk.values()
        )

        legacy_context_found = (
            cls._calculate_legacy_context_found(
                document_search_performed=(
                    document_search_performed
                ),
                document_context_found=(
                    document_context_found
                ),
                successful_non_document_tool=(
                    successful_non_document_tool
                ),
            )
        )

        return AgentToolContext(
            citations=citations,
            legacy_context_found=(
                legacy_context_found
            ),
        )

    @staticmethod
    def _calculate_legacy_context_found(
        *,
        document_search_performed: bool,
        document_context_found: bool,
        successful_non_document_tool: bool,
    ) -> bool:
        """
        Preserve the old frontend contract safely.

        The old field represented document context only.
        Until the frontend wording is updated, returning
        False for a successful Calendar answer would make
        the UI incorrectly display a document-context
        warning.

        Therefore False is returned only for a pure
        document-search request where retrieval found no
        context.
        """

        if (
            document_search_performed
            and not document_context_found
            and not successful_non_document_tool
        ):
            return False

        return True

    @classmethod
    def _collect_citations(
        cls,
        *,
        payload: dict[
            str,
            Any,
        ],
        target: dict[
            str,
            RagCitation,
        ],
    ) -> None:
        raw_citations = (
            payload.get(
                "citations"
            )
        )

        if not isinstance(
            raw_citations,
            list,
        ):
            return

        for raw_citation in (
            raw_citations
        ):
            if not isinstance(
                raw_citation,
                dict,
            ):
                continue

            try:
                citation = (
                    RagCitation
                    .model_validate(
                        raw_citation
                    )
                )
            except Exception:
                # Tool observations should never
                # break the entire chat response
                # because one optional citation
                # payload is malformed.
                continue

            key = str(
                citation.chunk_id
            )

            target.setdefault(
                key,
                citation,
            )

    @classmethod
    def _parse_tool_payload(
        cls,
        message: ToolMessage,
    ) -> dict[
        str,
        Any,
    ] | None:
        content = (
            cls._message_text(
                message.content
            )
        )

        if not content:
            return None

        try:
            payload = json.loads(
                content
            )
        except (
            json.JSONDecodeError,
            TypeError,
        ):
            return None

        if not isinstance(
            payload,
            dict,
        ):
            return None

        return payload

    @staticmethod
    def _message_text(
        content: Any,
    ) -> str:
        """
        Normalize both traditional string content and
        modern LangChain content-block responses.
        """

        if isinstance(
            content,
            str,
        ):
            return content.strip()

        if not isinstance(
            content,
            list,
        ):
            return str(
                content
            ).strip()

        text_parts: list[str] = []

        for block in content:
            if isinstance(
                block,
                str,
            ):
                normalized = (
                    block.strip()
                )

                if normalized:
                    text_parts.append(
                        normalized
                    )

                continue

            if not isinstance(
                block,
                dict,
            ):
                continue

            text = block.get(
                "text"
            )

            if (
                isinstance(
                    text,
                    str,
                )
                and text.strip()
            ):
                text_parts.append(
                    text.strip()
                )

        return "\n".join(
            text_parts
        ).strip()


class AgentToolContext:
    """
    Internal normalized metadata extracted from the
    completed LangGraph execution.
    """

    def __init__(
        self,
        *,
        citations: list[
            RagCitation
        ],
        legacy_context_found: bool,
    ) -> None:
        self.citations = citations
        self.legacy_context_found = (
            legacy_context_found
        )