from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings


class DataBaseHelper:
    def __init__(
        self, url: str, echo: bool = False, echo_pool: bool = False, pool_size: int = 5, max_overflow: int = 10
    ):
        self.engine: AsyncEngine = create_async_engine(
            url,
            echo=echo,
            echo_pool=echo_pool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=True,
            pool_recycle=1800,
        )
        self.session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self.engine,  # нужно для того, чтобы наши запросы происходили в асинк процессе
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    async def dispose(self) -> None:  # для закртия сессии
        await self.engine.dispose()

    async def session_getter(self) -> AsyncGenerator[AsyncSession]:  # аннтация типов -> у всех
        async with self.session_factory() as session:
            yield session  # далее закрытие сессии делатся само


db_helper = DataBaseHelper(
    url=str(settings.db.url),
    echo=settings.db.echo,
    echo_pool=settings.db.echo_pool,
    pool_size=settings.db.pool_size,
    max_overflow=settings.db.max_overflow,
)
