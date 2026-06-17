from core.config import settings
from fastapi import (
    APIRouter,
    Depends,
)
from fastapi.security import HTTPBearer

from .ai import router as ai_router
from .auth.users import router as users_router
from .auth.views import router as auth_router

# from .business.business_plan.views import router as business_plan_router
# from .business.plan_block.views import router as plan_block_router
from .business import router as business_router
from .calendar import router as calendar_router
from .crm import router as crm_router
from .dashboard import router as dashboard_router
from .financial import router as financial_router
from .kanban import router as kanban_router
from .notes import router as notes_router
from .notifications import router as notifications_router
from .oauth import router as oauth_router
from .search import router as search_router
from .tags import router as tags_router
from .tax_events import router as tax_events_router

http_bearer = HTTPBearer(auto_error=False)  # чтобы не париться

router = APIRouter(
    prefix=settings.api.v1.prefix,
    dependencies=[Depends(http_bearer)],
)
router.include_router(auth_router)
router.include_router(users_router)
# router.include_router(messages_router)
router.include_router(ai_router)
router.include_router(tags_router)
router.include_router(notes_router)
router.include_router(calendar_router)
router.include_router(dashboard_router)
router.include_router(search_router)
router.include_router(tax_events_router)
router.include_router(oauth_router)
router.include_router(kanban_router)
router.include_router(crm_router)
router.include_router(notifications_router)
router.include_router(business_router)
router.include_router(financial_router)
# router.include_router(business_plan_router)
# router.include_router(plan_block_router)
