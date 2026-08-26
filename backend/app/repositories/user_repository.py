import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.user_preference import UserPreference


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_auth0_subject(self, subject: str) -> User | None:
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.preferences))
            .where(User.auth0_subject == subject)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.session.execute(
            select(User).options(selectinload(User.preferences)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.preferences))
            .where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def create_from_auth0(
        self,
        *,
        subject: str,
        email: str,
        full_name: str | None,
        avatar_url: str | None,
        email_verified: bool,
    ) -> User:
        user = User(
            auth0_subject=subject,
            email=email.lower(),
            full_name=full_name,
            avatar_url=avatar_url,
            is_email_verified=email_verified,
        )
        user.preferences = UserPreference()
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_profile(self, user: User, *, full_name: str | None) -> User:
        user.full_name = full_name
        await self.session.flush()
        return user

    async def update_preferences(
        self,
        preferences: UserPreference,
        *,
        timezone: str | None,
        locale: str | None,
        email_notifications: bool | None,
    ) -> UserPreference:
        if timezone is not None:
            preferences.timezone = timezone
        if locale is not None:
            preferences.locale = locale
        if email_notifications is not None:
            preferences.email_notifications = email_notifications
        await self.session.flush()
        return preferences
