from core.config import settings
from fastapi import APIRouter

from .chart_point.views import router as point_router
from .currency.views import router as currency_router
from .financial_chart.views import router as chart_router

router = APIRouter(
    prefix=settings.api.v1.financial,
)

router.include_router(
    chart_router,
    prefix="/charts",
    tags=["Financial Charts"],
)
router.include_router(
    currency_router,
    prefix="/currencies",
    tags=["Currencies"],
)
router.include_router(
    point_router,
    prefix="/{chart_id}/points",
    tags=["Chart points"],
)
