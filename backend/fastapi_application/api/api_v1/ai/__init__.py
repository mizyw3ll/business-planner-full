from fastapi import APIRouter

from .views import router as ai_router

router = APIRouter(prefix="/ai")
router.include_router(ai_router)
