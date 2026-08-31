"""add Phase 4 Gmail email metadata

Revision ID: 20260831_0004
Revises: 20260828_0003
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260831_0004"
down_revision = "20260828_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_metadata",

        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "gmail_message_id",
            sa.String(length=256),
            nullable=False,
        ),

        sa.Column(
            "gmail_thread_id",
            sa.String(length=256),
            nullable=False,
        ),

        sa.Column(
            "rfc822_message_id",
            sa.String(length=1024),
            nullable=True,
        ),

        sa.Column(
            "sender",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "recipients",
            postgresql.ARRAY(
                sa.Text(),
            ),
            server_default=sa.text(
                "ARRAY[]::text[]"
            ),
            nullable=False,
        ),

        sa.Column(
            "subject",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "snippet",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "label_ids",
            postgresql.ARRAY(
                sa.String(length=255),
            ),
            server_default=sa.text(
                "ARRAY[]::varchar[]"
            ),
            nullable=False,
        ),

        sa.Column(
            "category",
            sa.String(length=32),
            server_default="other",
            nullable=False,
        ),

        sa.Column(
            "is_important",
            sa.Boolean(),
            server_default=sa.text(
                "false"
            ),
            nullable=False,
        ),

        sa.Column(
            "importance_score",
            sa.Float(),
            server_default=sa.text(
                "0"
            ),
            nullable=False,
        ),

        sa.Column(
            "summary",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "extracted_metadata",
            postgresql.JSONB(
                astext_type=sa.Text(),
            ),
            server_default=sa.text(
                "'{}'::jsonb"
            ),
            nullable=False,
        ),

        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "now()"
            ),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "now()"
            ),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "now()"
            ),
            nullable=False,
        ),

        sa.CheckConstraint(
            (
                "category IN ("
                "'important', "
                "'bill', "
                "'subscription', "
                "'deadline', "
                "'booking', "
                "'university', "
                "'receipt', "
                "'other'"
                ")"
            ),
            name=(
                "ck_email_metadata_"
                "category_valid"
            ),
        ),

        sa.CheckConstraint(
            (
                "importance_score >= 0 "
                "AND importance_score <= 1"
            ),
            name=(
                "ck_email_metadata_"
                "importance_score_range"
            ),
        ),

        sa.ForeignKeyConstraint(
            [
                "user_id",
            ],
            [
                "users.id",
            ],
            name=op.f(
                "fk_email_metadata_"
                "user_id_users"
            ),
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id",
            name=op.f(
                "pk_email_metadata"
            ),
        ),

        sa.UniqueConstraint(
            "user_id",
            "gmail_message_id",
            name=(
                "uq_email_metadata_"
                "user_id_gmail_message_id"
            ),
        ),
    )

    op.create_index(
        op.f(
            "ix_email_metadata_user_id"
        ),
        "email_metadata",
        [
            "user_id",
        ],
        unique=False,
    )

    op.create_index(
        (
            "ix_email_metadata_"
            "user_received_at"
        ),
        "email_metadata",
        [
            "user_id",
            "received_at",
        ],
        unique=False,
    )

    op.create_index(
        (
            "ix_email_metadata_"
            "user_category_received_at"
        ),
        "email_metadata",
        [
            "user_id",
            "category",
            "received_at",
        ],
        unique=False,
    )

    op.create_index(
        (
            "ix_email_metadata_"
            "user_important_received_at"
        ),
        "email_metadata",
        [
            "user_id",
            "is_important",
            "received_at",
        ],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        (
            "ix_email_metadata_"
            "user_important_received_at"
        ),
        table_name="email_metadata",
    )

    op.drop_index(
        (
            "ix_email_metadata_"
            "user_category_received_at"
        ),
        table_name="email_metadata",
    )

    op.drop_index(
        (
            "ix_email_metadata_"
            "user_received_at"
        ),
        table_name="email_metadata",
    )

    op.drop_index(
        op.f(
            "ix_email_metadata_user_id"
        ),
        table_name="email_metadata",
    )

    op.drop_table(
        "email_metadata"
    )