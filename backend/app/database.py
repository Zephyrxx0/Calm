"""Database connection and session management for Calm backend."""
import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/calm")

# Ensure async driver is used — convert postgresql:// to postgresql+asyncpg://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase transaction pooler (pgBouncer) does NOT support prepared statements.
# Disable them at every level: URL query param, SQLAlchemy engine arg, and raw connect arg.
if "?" in DATABASE_URL:
    DATABASE_URL += "&statement_cache_size=0"
else:
    DATABASE_URL += "?statement_cache_size=0"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    """Dependency for FastAPI — yields an async database session."""
    async with async_session_factory() as session:
        yield session
