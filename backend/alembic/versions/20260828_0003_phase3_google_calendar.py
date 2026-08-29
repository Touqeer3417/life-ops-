"""add phase 3 Google OAuth connection storage

Revision ID: 20260828_0003
Revises: 20260826_0002
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260828_0003"
down_revision = "20260826_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "oauth_connections",
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
            "provider",
            sa.String(length=32),
            server_default="google",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "access_token_encrypted",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "refresh_token_encrypted",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "token_type",
            sa.String(length=32),
            nullable=True,
        ),
        sa.Column(
            "token_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "scopes",
            postgresql.ARRAY(
                sa.String(length=255)
            ),
            server_default=sa.text(
                "ARRAY[]::varchar[]"
            ),
            nullable=False,
        ),
        sa.Column(
            "oauth_state_hash",
            sa.String(length=64),
            nullable=True,
        ),
        sa.Column(
            "oauth_state_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "pending_scopes",
            postgresql.ARRAY(
                sa.String(length=255)
            ),
            server_default=sa.text(
                "ARRAY[]::varchar[]"
            ),
            nullable=False,
        ),
        sa.Column(
            "connected_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "last_refreshed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "disconnected_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "last_error_code",
            sa.String(length=128),
            nullable=True,
        ),
        sa.Column(
            "last_error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "provider IN ('google')",
            name=op.f(
                "ck_oauth_connections_"
                "oauth_connection_provider_valid"
            ),
        ),
        sa.CheckConstraint(
            "status IN "
            "('pending', 'connected', "
            "'reauth_required', 'disconnected')",
            name=op.f(
                "ck_oauth_connections_"
                "oauth_connection_status_valid"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f(
                "fk_oauth_connections_"
                "user_id_users"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f(
                "pk_oauth_connections"
            ),
        ),
        sa.UniqueConstraint(
            "oauth_state_hash",
            name=op.f(
                "uq_oauth_connections_"
                "oauth_state_hash"
            ),
        ),
        sa.UniqueConstraint(
            "user_id",
            "provider",
            name=(
                "uq_oauth_connections_"
                "user_id_provider"
            ),
        ),
    )

    op.create_index(
        op.f(
            "ix_oauth_connections_user_id"
        ),
        "oauth_connections",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_oauth_connections_"
            "oauth_state_hash"
        ),
        "oauth_connections",
        ["oauth_state_hash"],
        unique=False,
    )

    op.create_index(
        "ix_oauth_connections_user_id_status",
        "oauth_connections",
        [
            "user_id",
            "status",
        ],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_oauth_connections_user_id_status",
        table_name="oauth_connections",
    )

    op.drop_index(
        op.f(
            "ix_oauth_connections_"
            "oauth_state_hash"
        ),
        table_name="oauth_connections",
    )

    op.drop_index(
        op.f(
            "ix_oauth_connections_user_id"
        ),
        table_name="oauth_connections",
    )

    op.drop_table(
        "oauth_connections"
    )