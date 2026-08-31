from fastapi import APIRouter

from app.api import (
    auth,
    calendar,
    chat,
    dashboard,
    documents,
    email,
    google_integrations,
    health,
    users,
)


api_router = APIRouter()

api_router.include_router(
    health.router
)
api_router.include_router(
    auth.router
)
api_router.include_router(
    users.router
)
api_router.include_router(
    dashboard.router
)
api_router.include_router(
    documents.router
)
api_router.include_router(
    chat.router
)
api_router.include_router(
    google_integrations.router
)
api_router.include_router(
    calendar.router
)
api_router.include_router(
    email.router
)