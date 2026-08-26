from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base class for expected application errors."""

    def __init__(self, message: str, *, status_code: int, code: str) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication is required") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="authentication_error",
        )


class AuthorizationError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="authorization_error",
        )


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, code="not_found")


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, code="conflict")


class UpstreamServiceError(AppError):
    def __init__(self, message: str = "An upstream service is unavailable") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            code="upstream_service_error",
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request.app.state.logger.exception("Unhandled application error", exc_info=exc)
        payload: dict[str, Any] = {
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected server error occurred",
            }
        }
        return JSONResponse(status_code=500, content=payload)
