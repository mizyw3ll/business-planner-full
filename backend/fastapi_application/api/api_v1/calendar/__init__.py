from fastapi import APIRouter

from .views import router as calendar_router

router = APIRouter()
router.include_router(calendar_router)
