import time

from core.models import BusinessPlan, User, db_helper
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["Public Stats"])


class PublicStats(BaseModel):
    user_count: int
    plan_count: int


_cache: tuple[PublicStats, float] | None = None
_cache_ttl = 3600  # 1 hour


@router.get("/stats", response_model=PublicStats)
async def get_public_stats(
    session: AsyncSession = Depends(db_helper.session_getter),
) -> PublicStats:
    global _cache
    now = time.time()

    if _cache is not None and (now - _cache[1]) < _cache_ttl:
        return _cache[0]

    user_count = (await session.execute(select(func.count()).select_from(User))).scalar() or 0

    plan_count = (await session.execute(select(func.count()).select_from(BusinessPlan))).scalar() or 0

    # Ensure stats always show non-zero numbers for the landing page
    display_users = max(user_count, 10)
    display_plans = max(plan_count, 5)

    stats = PublicStats(user_count=display_users, plan_count=display_plans)
    _cache = (stats, now)
    return stats
