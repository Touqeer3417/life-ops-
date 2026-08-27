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


class BadRequestError(AppError):
    def __init__(self, message: str = "The request is invalid") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="bad_request",
        )


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication is required") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="authentication_error",
        )


class AuthorizationError(AppError):
    def __init__(
        self,
        message: str = "You do not have permission to perform this action",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="authorization_error",
        )


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_404_NOT_FOUND,
            code="not_found",
        )


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_409_CONFLICT,
            code="conflict",
        )


class PayloadTooLargeError(AppError):
    def __init__(
        self,
        message: str = "The uploaded file exceeds the maximum allowed size",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            code="payload_too_large",
        )


class UnsupportedMediaTypeError(AppError):
    def __init__(
        self,
        message: str = "The uploaded file type is not supported",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            code="unsupported_media_type",
        )


class ValidationError(AppError):
    def __init__(self, message: str = "The supplied data is invalid") -> None:
        super().__init__(
            message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="validation_error",
        )


class DocumentProcessingError(AppError):
    def __init__(
        self,
        message: str = "The document could not be processed",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="document_processing_error",
        )


class UpstreamServiceError(AppError):
    def __init__(
        self,
        message: str = "An upstream service is unavailable",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            code="upstream_service_error",
        )


class ServiceUnavailableError(AppError):
    def __init__(
        self,
        message: str = "The requested service is temporarily unavailable",
    ) -> None:
        super().__init__(
            message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="service_unavailable",
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(
        _: Request,
        exc: AppError,
    ) -> JSONResponse:
        headers = (
            {"WWW-Authenticate": "Bearer"}
            if exc.status_code == status.HTTP_401_UNAUTHORIZED
            else None
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                }
            },
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        request.app.state.logger.exception(
            "Unhandled application error",
            exc_info=exc,
        )

        payload: dict[str, Any] = {
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected server error occurred",
            }
        }

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=payload,
        )