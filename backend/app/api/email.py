from typing import Annotated

from fastapi import (
    APIRouter,
    Path,
)

from app.dependencies import (
    CurrentUserDep,
    SessionDep,
    SettingsDep,
)
from app.schemas.email import (
    EmailSearchRequest,
    EmailSearchResponse,
    EmailSummaryResponse,
    GMAIL_MESSAGE_ID_PATTERN,
    ImportantEmailRequest,
    ImportantEmailResponse,
)
from app.services.email_service import (
    EmailService,
)


router = APIRouter(
    prefix="/email",
    tags=["email"],
)


@router.post(
    "/search",
    response_model=EmailSearchResponse,
)
async def search_email(
    payload: EmailSearchRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> EmailSearchResponse:
    """
    Search the authenticated user's authorized Gmail account.

    Search is metadata-first and uses Gmail-native filtering/pagination.
    It does not download the user's entire mailbox.
    """

    return await EmailService(
        session,
        settings,
    ).search(
        current_user=current_user,
        payload=payload,
    )


@router.post(
    "/important",
    response_model=ImportantEmailResponse,
)
async def list_important_email(
    payload: ImportantEmailRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> ImportantEmailResponse:
    """
    Return important Gmail messages for the authenticated user.

    Importance is based on both Gmail signals and LifeOps intelligence,
    including bills, renewals, deadlines, university messages,
    interviews and other time-sensitive email.
    """

    return await EmailService(
        session,
        settings,
    ).important(
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/messages/{message_id}/summary",
    response_model=EmailSummaryResponse,
)
async def summarize_email_message(
    message_id: Annotated[
        str,
        Path(
            min_length=1,
            max_length=256,
            pattern=(
                GMAIL_MESSAGE_ID_PATTERN
            ),
            description=(
                "Gmail message identifier returned "
                "by an authenticated email search."
            ),
        ),
    ],
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> EmailSummaryResponse:
    """
    Summarize and extract structured intelligence from one selected email.

    The raw body is processed only on the backend, is treated as
    untrusted data, and is not persisted in LifeOps.
    """

    return await EmailService(
        session,
        settings,
    ).summarize_message(
        current_user=current_user,
        message_id=message_id,
    )