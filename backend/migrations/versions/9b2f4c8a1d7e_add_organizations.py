"""Add organization scoping

Revision ID: 9b2f4c8a1d7e
Revises: e21611612f0f
Create Date: 2026-07-09 12:00:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = "9b2f4c8a1d7e"
down_revision: Union[str, None] = "e21611612f0f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_ORG_NAME = "St. Anthony's Malankara Catholic Church"


def upgrade() -> None:
    bind = op.get_bind()
    default_org_id = str(uuid.uuid4())

    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False, index=True),
        sa.Column("owner_email", sa.String(length=255), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_organizations_name", "organizations", ["name"])
    op.create_index("ix_organizations_owner_email", "organizations", ["owner_email"])

    op.create_table(
        "organization_admins",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("organization_id", sa.String(length=36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("organization_id", "email", name="uq_organization_admin_email"),
    )
    op.create_index("ix_organization_admins_organization_id", "organization_admins", ["organization_id"])
    op.create_index("ix_organization_admins_email", "organization_admins", ["email"])

    bind.execute(
        sa.text(
            "INSERT INTO organizations (id, name, owner_email, created_at) "
            "VALUES (:id, :name, :owner_email, CURRENT_TIMESTAMP)"
        ),
        {"id": default_org_id, "name": DEFAULT_ORG_NAME, "owner_email": "legacy@choir.org"},
    )

    for table_name in ["songs", "categories", "languages"]:
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.add_column(sa.Column("organization_id", sa.String(length=36), nullable=True))
            batch_op.create_index(f"ix_{table_name}_organization_id", ["organization_id"])
        bind.execute(
            sa.text(f"UPDATE {table_name} SET organization_id = :org_id WHERE organization_id IS NULL"),
            {"org_id": default_org_id},
        )

    legacy_admin_rows = bind.execute(sa.text("SELECT email FROM admin_emails")).fetchall()
    for row in legacy_admin_rows:
        bind.execute(
            sa.text(
                "INSERT INTO organization_admins (id, organization_id, email, created_at) "
                "VALUES (:id, :organization_id, :email, CURRENT_TIMESTAMP)"
            ),
            {"id": str(uuid.uuid4()), "organization_id": default_org_id, "email": row[0]},
        )


def downgrade() -> None:
    for table_name in ["songs", "categories", "languages"]:
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_index(f"ix_{table_name}_organization_id")
            batch_op.drop_column("organization_id")

    op.drop_index("ix_organization_admins_email", table_name="organization_admins")
    op.drop_index("ix_organization_admins_organization_id", table_name="organization_admins")
    op.drop_table("organization_admins")
    op.drop_index("ix_organizations_owner_email", table_name="organizations")
    op.drop_index("ix_organizations_name", table_name="organizations")
    op.drop_table("organizations")
