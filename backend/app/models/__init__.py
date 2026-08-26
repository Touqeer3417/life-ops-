"""SQLAlchemy model exports used by application code and Alembic."""

from app.models.user import User
from app.models.user_preference import UserPreference

__all__ = ["User", "UserPreference"]
