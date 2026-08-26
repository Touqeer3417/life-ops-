from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.config import get_settings
from app.dependencies import SessionDep
from app.schemas.common import HealthResponse, ReadinessResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.app_name)


@router.get("/ready", response_model=ReadinessResponse)
async def readiness(session: SessionDep) -> ReadinessResponse:
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not ready",
        ) from exc
    return ReadinessResponse(status="ok", database="connected")
