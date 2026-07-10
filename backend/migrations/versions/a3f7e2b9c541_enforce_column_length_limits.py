"""Enforce column length limits

Revision ID: a3f7e2b9c541
Revises: 9b2f4c8a1d7e
Create Date: 2026-07-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a3f7e2b9c541"
down_revision: Union[str, None] = "9b2f4c8a1d7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.alter_column("name", type_=sa.String(100), existing_nullable=False)

    with op.batch_alter_table("songs") as batch_op:
        batch_op.alter_column("title", type_=sa.String(200), existing_nullable=False)
        batch_op.alter_column("audio_url", type_=sa.String(500), existing_nullable=True)

    with op.batch_alter_table("categories") as batch_op:
        batch_op.alter_column("name", type_=sa.String(50), existing_nullable=False)

    with op.batch_alter_table("languages") as batch_op:
        batch_op.alter_column("name", type_=sa.String(50), existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.alter_column("name", type_=sa.String(255), existing_nullable=False)

    with op.batch_alter_table("songs") as batch_op:
        batch_op.alter_column("title", type_=sa.String(255), existing_nullable=False)
        batch_op.alter_column("audio_url", type_=sa.String(1024), existing_nullable=True)

    with op.batch_alter_table("categories") as batch_op:
        batch_op.alter_column("name", type_=sa.String(100), existing_nullable=False)

    with op.batch_alter_table("languages") as batch_op:
        batch_op.alter_column("name", type_=sa.String(100), existing_nullable=False)
