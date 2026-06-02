"""init_db_uuid_v4

Revision ID: 0001
Revises: 
Create Date: 2026-03-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1. Criação dos tipos ENUM exigidos no PostgreSQL com Safe Mode
    user_role_enum = postgresql.ENUM('AGENCY', 'CLIENT', name='userrole', create_type=False)
    user_role_enum.create(op.get_bind(), checkfirst=True)
    
    post_status_enum = postgresql.ENUM('PENDING_UPLOAD', 'CRIADO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO', name='poststatus', create_type=False)
    post_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Tabelas Core (Regras B2B)
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', user_role_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'calendars',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('month', sa.String(), nullable=True),
    )

    op.create_table(
        'posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('calendar_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calendars.id')),
        sa.Column('media_url', sa.String(), nullable=False),
        sa.Column('status', post_status_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'ideas',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
    )

    # 3. O Cofre de Feedback Visual Point-To-Point
    op.create_table(
        'comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('posts.id')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('coord_x', sa.Float(), nullable=True),
        sa.Column('coord_y', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('comments')
    op.drop_table('ideas')
    op.drop_table('posts')
    op.drop_table('calendars')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    
    op.execute("DROP TYPE IF EXISTS poststatus;")
    op.execute("DROP TYPE IF EXISTS userrole;")
