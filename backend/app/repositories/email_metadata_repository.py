import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import (
    delete,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import (
    insert,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import (
    noload,
)

from app.models.email_metadata import (
    EmailMetadata,
)


@dataclass(
    frozen=True,
    slots=True,
)
class EmailMetadataUpsert:
    """
    Sanitized metadata that may be persisted for a Gmail message.

    Raw email bodies and attachments must never be stored here.
    """

    gmail_message_id: str
    gmail_thread_id: str

    rfc822_message_id: str | None

    sender: str | None

    recipients: list[str]

    subject: str | None

    received_at: datetime | None

    snippet: str | None

    label_ids: list[str]

    category: str

    is_important: bool

    importance_score: float

    summary: str | None

    extracted_metadata: dict[
        str,
        Any,
    ]


class EmailMetadataRepository:
    """
    User-scoped persistence for processed Gmail metadata.

    This repository intentionally stores only sanitized metadata
    and structured intelligence.

    It must never persist:

    - raw Gmail bodies
    - attachments
    - OAuth access tokens
    - OAuth refresh tokens
    - Gmail credentials
    """

    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def get_by_gmail_message_id(
        self,
        *,
        user_id: uuid.UUID,
        gmail_message_id: str,
    ) -> EmailMetadata | None:
        statement = (
            select(
                EmailMetadata
            )
            .options(
                noload(
                    EmailMetadata.user
                )
            )
            .where(
                EmailMetadata.user_id
                == user_id,
                EmailMetadata.gmail_message_id
                == gmail_message_id,
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        return (
            result.scalar_one_or_none()
        )

    async def get_by_id(
        self,
        *,
        user_id: uuid.UUID,
        metadata_id: uuid.UUID,
    ) -> EmailMetadata | None:
        statement = (
            select(
                EmailMetadata
            )
            .options(
                noload(
                    EmailMetadata.user
                )
            )
            .where(
                EmailMetadata.user_id
                == user_id,
                EmailMetadata.id
                == metadata_id,
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        return (
            result.scalar_one_or_none()
        )

    async def list_for_user(
        self,
        *,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[
        EmailMetadata
    ]:
        normalized_limit = max(
            1,
            min(
                limit,
                100,
            ),
        )

        normalized_offset = max(
            0,
            offset,
        )

        statement = (
            select(
                EmailMetadata
            )
            .options(
                noload(
                    EmailMetadata.user
                )
            )
            .where(
                EmailMetadata.user_id
                == user_id
            )
            .order_by(
                EmailMetadata
                .received_at
                .desc()
                .nullslast(),
                EmailMetadata
                .created_at
                .desc(),
            )
            .limit(
                normalized_limit
            )
            .offset(
                normalized_offset
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        return list(
            result.scalars().all()
        )

    async def upsert_processed_metadata(
        self,
        *,
        user_id: uuid.UUID,
        data: EmailMetadataUpsert,
    ) -> EmailMetadata:
        """
        Insert or update sanitized metadata for one Gmail message.

        The uniqueness boundary is:

            (user_id, gmail_message_id)

        This prevents one LifeOps user's Gmail metadata from
        colliding with another user's metadata.
        """

        values = {
            "user_id":
                user_id,

            "gmail_message_id":
                data.gmail_message_id,

            "gmail_thread_id":
                data.gmail_thread_id,

            "rfc822_message_id":
                data.rfc822_message_id,

            "sender":
                data.sender,

            "recipients":
                list(
                    data.recipients
                ),

            "subject":
                data.subject,

            "received_at":
                data.received_at,

            "snippet":
                data.snippet,

            "label_ids":
                list(
                    data.label_ids
                ),

            "category":
                data.category,

            "is_important":
                data.is_important,

            "importance_score":
                data.importance_score,

            "summary":
                data.summary,

            "extracted_metadata":
                dict(
                    data.extracted_metadata
                ),

            "processed_at":
                func.now(),
        }

        insert_statement = (
            insert(
                EmailMetadata
            )
            .values(
                **values
            )
        )

        statement = (
            insert_statement
            .on_conflict_do_update(
                constraint=(
                    "uq_email_metadata_"
                    "user_id_gmail_message_id"
                ),
                set_={
                    "gmail_thread_id":
                        insert_statement
                        .excluded
                        .gmail_thread_id,

                    "rfc822_message_id":
                        insert_statement
                        .excluded
                        .rfc822_message_id,

                    "sender":
                        insert_statement
                        .excluded
                        .sender,

                    "recipients":
                        insert_statement
                        .excluded
                        .recipients,

                    "subject":
                        insert_statement
                        .excluded
                        .subject,

                    "received_at":
                        insert_statement
                        .excluded
                        .received_at,

                    "snippet":
                        insert_statement
                        .excluded
                        .snippet,

                    "label_ids":
                        insert_statement
                        .excluded
                        .label_ids,

                    "category":
                        insert_statement
                        .excluded
                        .category,

                    "is_important":
                        insert_statement
                        .excluded
                        .is_important,

                    "importance_score":
                        insert_statement
                        .excluded
                        .importance_score,

                    "summary":
                        insert_statement
                        .excluded
                        .summary,

                    "extracted_metadata":
                        insert_statement
                        .excluded
                        .extracted_metadata,

                    "processed_at":
                        func.now(),

                    "updated_at":
                        func.now(),
                },
            )
            .returning(
                EmailMetadata
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        metadata = (
            result.scalar_one()
        )

        await self.session.flush()

        return metadata

    async def count_for_user(
        self,
        *,
        user_id: uuid.UUID,
    ) -> int:
        statement = (
            select(
                func.count(
                    EmailMetadata.id
                )
            )
            .where(
                EmailMetadata.user_id
                == user_id
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        return int(
            result.scalar_one()
        )

    async def delete_for_user(
        self,
        *,
        user_id: uuid.UUID,
    ) -> int:
        """
        Remove all persisted Gmail metadata for one LifeOps user.

        OAuth credentials are managed separately and are not
        touched by this repository.
        """

        statement = (
            delete(
                EmailMetadata
            )
            .where(
                EmailMetadata.user_id
                == user_id
            )
            .returning(
                EmailMetadata.id
            )
        )

        result = (
            await self.session.execute(
                statement
            )
        )

        deleted_ids = list(
            result.scalars().all()
        )

        await self.session.flush()

        return len(
            deleted_ids
        )