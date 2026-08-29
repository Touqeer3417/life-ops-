import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    register_exception_handlers,
)
from app.core.logging import (
    configure_logging,
)
from app.database.session import (
    dispose_engine,
)
from app.middleware.request_id import (
    RequestIdMiddleware,
)


settings = get_settings()

configure_logging(
    settings.debug
)

logger = logging.getLogger(
    "lifeops"
)


@asynccontextmanager
async def lifespan(
    app: FastAPI,
):
    """
    Application startup/shutdown lifecycle.

    Phase 3 Google Calendar configuration is intentionally not
    required during general application startup. This preserves
    Phase 1/2 functionality when Google Calendar has not yet been
    configured.

    Google-specific configuration is validated when Google
    integration functionality is actually used.
    """

    settings.validate_runtime()

    app.state.logger = logger

    logger.info(
        "Starting %s in %s mode",
        settings.app_name,
        settings.app_env,
    )

    if settings.google_calendar_configured:
        logger.info(
            "Google Calendar integration "
            "configuration detected"
        )
    else:
        logger.info(
            "Google Calendar integration is "
            "not configured; Phase 1/2 "
            "functionality remains available"
        )

    yield

    await dispose_engine()

    logger.info(
        "Stopped %s",
        settings.app_name,
    )


app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    debug=settings.debug,
    lifespan=lifespan,
    docs_url=(
        "/docs"
        if settings.app_env
        != "production"
        else None
    ),
    redoc_url=(
        "/redoc"
        if settings.app_env
        != "production"
        else None
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        settings.cors_origins
    ),
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Request-ID",
    ],
    expose_headers=[
        "X-Request-ID",
    ],
)

app.add_middleware(
    RequestIdMiddleware
)

register_exception_handlers(
    app
)

app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)


@app.get(
    "/",
    include_in_schema=False,
)
async def root() -> dict[
    str,
    str,
]:
    return {
        "name": settings.app_name,
        "phase": (
            "3-google-calendar-agent"
        ),
        "status": "online",
    }