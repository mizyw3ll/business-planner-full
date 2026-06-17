from fastapi import APIRouter

from .stats import router as stats_router

router = APIRouter(prefix="/public")
router.include_router(stats_router)
