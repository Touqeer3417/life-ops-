from fastapi import APIRouter

from app.dependencies import CurrentUserDep
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: CurrentUserDep) -> DashboardSummary:
    return DashboardService.build_summary(current_user)
