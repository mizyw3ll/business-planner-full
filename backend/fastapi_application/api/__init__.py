from core.config import settings
from fastapi import APIRouter

from .api_v1 import router as router_api_v1
from .public import router as public_router

router = APIRouter(
    prefix=settings.api.prefix,
)
router.include_router(
    router_api_v1,
)
router.include_router(
    public_router,
)
