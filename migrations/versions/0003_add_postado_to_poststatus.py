"""add_postado_to_poststatus_enum

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("ALTER TYPE poststatus ADD VALUE 'POSTADO'")

def downgrade():
    op.execute("ALTER TYPE poststatus RENAME TO poststatus_old")
    op.execute("CREATE TYPE poststatus AS ENUM('PENDING_UPLOAD', 'CRIADO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO')")
    op.execute("ALTER TABLE posts ALTER COLUMN status TYPE poststatus USING status::text::poststatus")
    op.execute("DROP TYPE poststatus_old")
