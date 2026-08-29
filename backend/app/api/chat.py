from fastapi import APIRouter

from app.dependencies import (
    CurrentUserDep,
    SessionDep,
)
from app.schemas.chat import (
    RagChatRequest,
    RagChatResponse,
)
from app.services.agent_service import (
    AgentService,
)


router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


@router.post(
    "",
    response_model=RagChatResponse,
)
async def lifeops_chat(
    payload: RagChatRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> RagChatResponse:
    """
    Run the authenticated LifeOps AI assistant.

    The agent can autonomously choose between:
    - the authenticated user's indexed documents;
    - the authenticated user's connected Google Calendar.

    Authentication and database scoping are resolved by
    FastAPI dependencies before the agent is executed.
    """

    return await AgentService(
        session
    ).ask(
        current_user=current_user,
        payload=payload,
    )