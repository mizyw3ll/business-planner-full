from fastapi import APIRouter

from .views import router as tags_router

router = APIRouter(tags=["Tags"])
router.include_router(tags_router)
