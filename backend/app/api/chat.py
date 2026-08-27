from fastapi import APIRouter

from app.dependencies import (
    CurrentUserDep,
    SessionDep,
)
from app.schemas.chat import (
    RagChatRequest,
    RagChatResponse,
)
from app.services.rag_service import RagService


router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


@router.post(
    "",
    response_model=RagChatResponse,
)
async def rag_chat(
    payload: RagChatRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> RagChatResponse:
    """
    Answer a question using only the authenticated user's indexed documents.

    This is Phase 2 standard RAG. It does not run agents, LangGraph workflows,
    external tools, Gmail actions, Calendar actions, or autonomous execution.
    """
    return await RagService(
        session
    ).ask(
        current_user=current_user,
        payload=payload,
    )