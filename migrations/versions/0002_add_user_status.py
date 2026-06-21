"""add_user_status

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

def upgrade():
    user_status_enum = postgresql.ENUM('APPROVED', 'PENDING', 'REJECTED', name='userstatus', create_type=False)
    user_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'users',
        sa.Column('status', user_status_enum, nullable=False, server_default='APPROVED')
    )

    op.alter_column('users', 'status', server_default=None)


def downgrade():
    op.drop_column('users', 'status')
    op.execute("DROP TYPE IF EXISTS userstatus;")
