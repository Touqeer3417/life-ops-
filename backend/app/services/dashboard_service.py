from datetime import UTC, datetime

from app.models.user import User
from app.schemas.dashboard import DashboardSummary, FoundationStatus, ModuleStatus
from app.schemas.user import UserRead


class DashboardService:
    @staticmethod
    def build_summary(user: User) -> DashboardSummary:
        return DashboardSummary(
            user=UserRead.model_validate(user),
            foundation=FoundationStatus(),
            generated_at=datetime.now(UTC),
            upcoming_modules=[
                ModuleStatus(name="Personal Knowledge Base & RAG", phase=2),
                ModuleStatus(name="Google Calendar Agent", phase=3),
                ModuleStatus(name="Gmail Intelligence Agent", phase=4),
                ModuleStatus(name="Agentic RAG Orchestration", phase=5),
            ],
        )
