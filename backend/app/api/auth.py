from fastapi import APIRouter

from app.dependencies import AuthContextDep
from app.schemas.auth import AuthSessionResponse

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/session", response_model=AuthSessionResponse)
async def session(auth: AuthContextDep) -> AuthSessionResponse:
    return AuthSessionResponse(
        subject=auth.claims.sub,
        scopes=sorted(auth.claims.scopes),
    )
