from cryptography.fernet import (
    Fernet,
    InvalidToken,
)

from app.core.config import Settings
from app.core.exceptions import (
    OAuthTokenDecryptionError,
    ServiceUnavailableError,
)


class OAuthTokenCipher:
    """
    Encrypt and decrypt OAuth credentials before database persistence.

    Raw Google access and refresh tokens must never be stored directly in
    PostgreSQL or exposed to frontend clients.
    """

    def __init__(
        self,
        settings: Settings,
    ) -> None:
        try:
            settings.validate_google_calendar_configuration()
        except RuntimeError as exc:
            raise ServiceUnavailableError(
                str(exc)
            ) from exc

        key = (
            settings.google_oauth_token_encryption_key
            .get_secret_value()
            .strip()
        )

        try:
            self._fernet = Fernet(
                key.encode("ascii")
            )
        except (
            ValueError,
            TypeError,
            UnicodeEncodeError,
        ) as exc:
            raise ServiceUnavailableError(
                "OAuth token encryption is incorrectly configured"
            ) from exc

    def encrypt(
        self,
        token: str,
    ) -> str:
        """
        Encrypt a non-empty OAuth credential.

        The returned value is safe to persist as application ciphertext,
        provided the encryption key is kept outside the database.
        """

        normalized = token.strip()

        if not normalized:
            raise ValueError(
                "OAuth token cannot be empty"
            )

        encrypted = self._fernet.encrypt(
            normalized.encode("utf-8")
        )

        return encrypted.decode(
            "ascii"
        )

    def decrypt(
        self,
        encrypted_token: str,
    ) -> str:
        """
        Decrypt OAuth ciphertext previously produced by this service.

        Invalid ciphertext normally means the configured encryption key was
        changed, the database value was corrupted, or a non-encrypted value
        was inserted into an encrypted token column.
        """

        normalized = encrypted_token.strip()

        if not normalized:
            raise OAuthTokenDecryptionError(
                "Stored OAuth credential is empty"
            )

        try:
            decrypted = self._fernet.decrypt(
                normalized.encode("ascii")
            )
        except (
            InvalidToken,
            UnicodeEncodeError,
        ) as exc:
            raise OAuthTokenDecryptionError() from exc

        try:
            token = decrypted.decode(
                "utf-8"
            )
        except UnicodeDecodeError as exc:
            raise OAuthTokenDecryptionError() from exc

        if not token:
            raise OAuthTokenDecryptionError(
                "Stored OAuth credential decrypted to an empty value"
            )

        return token

    def encrypt_optional(
        self,
        token: str | None,
    ) -> str | None:
        if token is None:
            return None

        normalized = token.strip()

        if not normalized:
            return None

        return self.encrypt(
            normalized
        )

    def decrypt_optional(
        self,
        encrypted_token: str | None,
    ) -> str | None:
        if encrypted_token is None:
            return None

        normalized = encrypted_token.strip()

        if not normalized:
            return None

        return self.decrypt(
            normalized
        )