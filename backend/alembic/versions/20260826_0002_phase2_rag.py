"""add phase 2 documents, chunks, and pgvector

Revision ID: 20260826_0002
Revises: 20260825_0001
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

from app.core.config import get_settings


revision = "20260826_0002"
down_revision = "20260825_0001"
branch_labels = None
depends_on = None


EMBEDDING_DIMENSION = get_settings().embedding_dimension


def upgrade() -> None:
    op.execute(
        sa.text(
            "CREATE EXTENSION IF NOT EXISTS vector"
        )
    )

    op.create_table(
        "documents",
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
            "original_filename",
            sa.String(length=512),
            nullable=False,
        ),
        sa.Column(
            "stored_filename",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "stored_path",
            sa.String(length=2048),
            nullable=False,
        ),
        sa.Column(
            "mime_type",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "file_extension",
            sa.String(length=16),
            nullable=False,
        ),
        sa.Column(
            "file_size",
            sa.BigInteger(),
            nullable=False,
        ),
        sa.Column(
            "checksum",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default=sa.text("'processing'"),
            nullable=False,
        ),
        sa.Column(
            "processing_error",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "indexed_at",
            sa.DateTime(timezone=True),
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
            "status IN ('processing', 'indexed', 'failed')",
            name=op.f(
                "ck_documents_document_status_valid"
            ),
        ),
        sa.CheckConstraint(
            "file_size > 0",
            name=op.f(
                "ck_documents_document_file_size_positive"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f(
                "fk_documents_user_id_users"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f("pk_documents"),
        ),
        sa.UniqueConstraint(
            "user_id",
            "checksum",
            name="uq_documents_user_id_checksum",
        ),
    )

    op.create_index(
        op.f("ix_documents_user_id"),
        "documents",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "ix_documents_user_id_status",
        "documents",
        ["user_id", "status"],
        unique=False,
    )

    op.create_index(
        "ix_documents_user_id_created_at",
        "documents",
        ["user_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "document_chunks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "document_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "chunk_index",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "embedding",
            Vector(EMBEDDING_DIMENSION),
            nullable=False,
        ),
        sa.Column(
            "page_number",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "source",
            sa.String(length=1024),
            nullable=True,
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(
                astext_type=sa.Text()
            ),
            server_default=sa.text(
                "'{}'::jsonb"
            ),
            nullable=False,
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
            "chunk_index >= 0",
            name=op.f(
                "ck_document_chunks_document_chunk_index_non_negative"
            ),
        ),
        sa.CheckConstraint(
            "char_length(btrim(content)) > 0",
            name=op.f(
                "ck_document_chunks_document_chunk_content_not_empty"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f(
                "fk_document_chunks_document_id_documents"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f(
                "pk_document_chunks"
            ),
        ),
        sa.UniqueConstraint(
            "document_id",
            "chunk_index",
            name="uq_document_chunks_document_id_chunk_index",
        ),
    )

    op.create_index(
        op.f(
            "ix_document_chunks_document_id"
        ),
        "document_chunks",
        ["document_id"],
        unique=False,
    )

    op.create_index(
        "ix_document_chunks_document_id_chunk_index",
        "document_chunks",
        [
            "document_id",
            "chunk_index",
        ],
        unique=False,
    )

    op.create_index(
        "ix_document_chunks_embedding_hnsw",
        "document_chunks",
        ["embedding"],
        unique=False,
        postgresql_using="hnsw",
        postgresql_with={
            "m": 16,
            "ef_construction": 64,
        },
        postgresql_ops={
            "embedding": "vector_cosine_ops",
        },
    )


def downgrade() -> None:
    op.drop_index(
        "ix_document_chunks_embedding_hnsw",
        table_name="document_chunks",
        postgresql_using="hnsw",
    )

    op.drop_index(
        "ix_document_chunks_document_id_chunk_index",
        table_name="document_chunks",
    )

    op.drop_index(
        op.f(
            "ix_document_chunks_document_id"
        ),
        table_name="document_chunks",
    )

    op.drop_table(
        "document_chunks"
    )

    op.drop_index(
        "ix_documents_user_id_created_at",
        table_name="documents",
    )

    op.drop_index(
        "ix_documents_user_id_status",
        table_name="documents",
    )

    op.drop_index(
        op.f("ix_documents_user_id"),
        table_name="documents",
    )

    op.drop_table(
        "documents"
    )