from logging.config import fileConfig
from sqlalchemy import create_engine, pool, text
from alembic import context
from app.db.models import Base
from app.core.config import DATABASE_URL

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version_events",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Create engine directly to avoid configparser interpolation issues with
    # special characters in the DATABASE_URL (e.g. Neon connection strings).
    connectable = create_engine(DATABASE_URL, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        # Ensure we're operating in the public schema (required for Neon)
        connection.execute(text("SET search_path TO public"))
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table="alembic_version_events",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
