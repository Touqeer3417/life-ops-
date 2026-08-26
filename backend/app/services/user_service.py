from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.models.user import User
from app.models.user_preference import UserPreference
from app.repositories.user_repository import UserRepository
from app.schemas.user import Auth0UserInfo, UserPreferenceUpdate, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = UserRepository(session)

    async def get_or_create_from_identity(self, info: Auth0UserInfo) -> User:
        user = await self.repository.get_by_auth0_subject(info.sub)
        normalized_email = str(info.email).lower()

        if user is not None:
            changed = False
            if user.email != normalized_email:
                email_owner = await self.repository.get_by_email(normalized_email)
                if email_owner is not None and email_owner.id != user.id:
                    raise ConflictError(
                        "This email is already associated with another LifeOps account"
                    )
                user.email = normalized_email
                changed = True
            if user.is_email_verified != info.email_verified:
                user.is_email_verified = info.email_verified
                changed = True
            avatar = str(info.picture) if info.picture else None
            if user.avatar_url != avatar:
                user.avatar_url = avatar
                changed = True
            if not user.full_name and info.name:
                user.full_name = info.name
                changed = True
            if changed:
                await self.session.commit()
            return user

        email_owner = await self.repository.get_by_email(normalized_email)
        if email_owner is not None:
            raise ConflictError(
                "This email is already associated with another LifeOps account"
            )

        user = await self.repository.create_from_auth0(
            subject=info.sub,
            email=normalized_email,
            full_name=info.name,
            avatar_url=str(info.picture) if info.picture else None,
            email_verified=info.email_verified,
        )
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            existing = await self.repository.get_by_auth0_subject(info.sub)
            if existing is not None:
                return existing
            raise ConflictError("Unable to create the user because the account already exists") from exc
        return user

    async def update_profile(self, user: User, payload: UserUpdate) -> User:
        updated = await self.repository.update_profile(user, full_name=payload.full_name)
        await self.session.commit()
        return updated

    async def update_preferences(
        self, user: User, payload: UserPreferenceUpdate
    ) -> UserPreference:
        updated = await self.repository.update_preferences(
            user.preferences,
            timezone=payload.timezone,
            locale=payload.locale,
            email_notifications=payload.email_notifications,
        )
        await self.session.commit()
        return updated
