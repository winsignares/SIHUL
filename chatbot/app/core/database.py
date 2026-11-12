from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

_ajustes = get_settings()
engine = create_async_engine(
    _ajustes.DATABASE_URL, echo=False, pool_size=_ajustes.DB_POOL_SIZE, max_overflow=_ajustes.DB_MAX_OVERFLOW,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
