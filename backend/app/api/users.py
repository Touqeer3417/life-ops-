from fastapi import APIRouter

from app.dependencies import CurrentUserDep, SessionDep
from app.schemas.user import (
    UserPreferenceRead,
    UserPreferenceUpdate,
    UserRead,
    UserUpdate,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUserDep) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserRead:
    user = await UserService(session).update_profile(current_user, payload)
    return UserRead.model_validate(user)


@router.get("/preferences", response_model=UserPreferenceRead)
async def get_preferences(current_user: CurrentUserDep) -> UserPreferenceRead:
    return UserPreferenceRead.model_validate(current_user.preferences)


@router.patch("/preferences", response_model=UserPreferenceRead)
async def update_preferences(
    payload: UserPreferenceUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserPreferenceRead:
    preferences = await UserService(session).update_preferences(current_user, payload)
    return UserPreferenceRead.model_validate(preferences)
