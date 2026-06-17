from core.authentication.oauth import github_oauth_client, google_oauth_client
from core.config import settings
from fastapi import APIRouter
from fastapi_users.router.oauth import get_oauth_router

from api.dependencies.authentication import authentication_backend, get_user_manager

router = APIRouter(prefix="/oauth", tags=["OAuth"])


# Google OAuth router
google_router = get_oauth_router(
    google_oauth_client,
    authentication_backend,
    get_user_manager,
    settings.oauth.google_state_secret,
    is_verified_by_default=True,
)
router.include_router(google_router, prefix="/google")

# GitHub OAuth router
github_router = get_oauth_router(
    github_oauth_client,
    authentication_backend,
    get_user_manager,
    settings.oauth.github_state_secret,
    is_verified_by_default=True,
)
router.include_router(github_router, prefix="/github")
