import asyncio
import os
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings, get_settings
from app.core.exceptions import DocumentProcessingError


@dataclass(frozen=True, slots=True)
class StoredFile:
    stored_filename: str
    stored_path: str


class LocalFileStorage:
    """Configurable local storage for uploaded Phase 2 documents."""

    def __init__(
        self,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.base_directory = (
            self.settings.upload_dir
            .expanduser()
            .resolve()
        )

    async def save(
        self,
        *,
        user_id: uuid.UUID,
        file_bytes: bytes,
        extension: str,
    ) -> StoredFile:
        if not file_bytes:
            raise DocumentProcessingError(
                "Cannot store an empty document"
            )

        normalized_extension = (
            extension.strip().lower()
        )

        if not normalized_extension.startswith("."):
            normalized_extension = (
                f".{normalized_extension}"
            )

        if (
            normalized_extension
            not in self.settings.allowed_extension_set
        ):
            raise DocumentProcessingError(
                "Cannot store an unsupported document type"
            )

        stored_filename = (
            f"{uuid.uuid4().hex}"
            f"{normalized_extension}"
        )

        relative_path = (
            Path(str(user_id))
            / stored_filename
        )

        destination = self._resolve_safe_path(
            relative_path
        )

        temporary_path = destination.with_name(
            f".{destination.name}.tmp"
        )

        try:
            await asyncio.to_thread(
                self._write_file_atomic,
                temporary_path,
                destination,
                file_bytes,
            )
        except OSError as exc:
            raise DocumentProcessingError(
                "Unable to store the uploaded document"
            ) from exc

        return StoredFile(
            stored_filename=stored_filename,
            stored_path=relative_path.as_posix(),
        )

    async def delete(
        self,
        stored_path: str,
    ) -> bool:
        if not stored_path.strip():
            return False

        destination = self._resolve_safe_path(
            Path(stored_path)
        )

        try:
            return await asyncio.to_thread(
                self._delete_file,
                destination,
            )
        except OSError as exc:
            raise DocumentProcessingError(
                "Unable to delete the stored document"
            ) from exc

    async def exists(
        self,
        stored_path: str,
    ) -> bool:
        if not stored_path.strip():
            return False

        destination = self._resolve_safe_path(
            Path(stored_path)
        )

        return await asyncio.to_thread(
            destination.is_file
        )

    def _resolve_safe_path(
        self,
        relative_path: Path,
    ) -> Path:
        if relative_path.is_absolute():
            raise DocumentProcessingError(
                "Invalid document storage path"
            )

        candidate = (
            self.base_directory
            / relative_path
        ).resolve()

        try:
            candidate.relative_to(
                self.base_directory
            )
        except ValueError as exc:
            raise DocumentProcessingError(
                "Invalid document storage path"
            ) from exc

        return candidate

    @staticmethod
    def _write_file_atomic(
        temporary_path: Path,
        destination: Path,
        file_bytes: bytes,
    ) -> None:
        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            with temporary_path.open("wb") as file_handle:
                file_handle.write(
                    file_bytes
                )
                file_handle.flush()
                os.fsync(
                    file_handle.fileno()
                )

            os.replace(
                temporary_path,
                destination,
            )
        finally:
            if temporary_path.exists():
                temporary_path.unlink(
                    missing_ok=True
                )

    @staticmethod
    def _delete_file(
        destination: Path,
    ) -> bool:
        if not destination.exists():
            return False

        if not destination.is_file():
            raise OSError(
                "Storage path is not a file"
            )

        destination.unlink()

        parent = destination.parent

        try:
            parent.rmdir()
        except OSError:
            pass

        return True