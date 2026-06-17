from core.config import settings
from fastapi import APIRouter

from .business_plan.export_views import export_router
from .business_plan.import_views import import_router
from .business_plan.snapshot_views import snapshot_router
from .business_plan.tag_views import tag_router
from .business_plan.views import router as business_plan_router
from .plan_block.views import router as plan_block_router
from .template.views import router as template_router

router = APIRouter(
    prefix=settings.api.v1.business_plan,
)

router.include_router(
    business_plan_router,
    prefix=settings.api.nested.plans,
    tags=["Business plan"],
)
router.include_router(
    import_router,
    prefix=settings.api.nested.plans,
    tags=["Business plan"],
)
router.include_router(
    export_router,
    prefix=settings.api.nested.plans,
    tags=["Business plan"],
)
router.include_router(
    snapshot_router,
    prefix=settings.api.nested.plans,
    tags=["Business plan"],
)
router.include_router(
    tag_router,
    prefix=settings.api.nested.plans,
    tags=["Business plan"],
)
router.include_router(
    plan_block_router,
    prefix="/plans/{plan_id}/blocks",
    tags=["Plan Blocks"],
)
router.include_router(
    template_router,
    prefix="/templates",
    tags=["Templates"],
)
