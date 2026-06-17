from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.google import GoogleOAuth2

from core.config import settings

# OAuth clients
google_oauth_client = GoogleOAuth2(
    client_id=settings.oauth.google_client_id,
    client_secret=settings.oauth.google_client_secret,
)

github_oauth_client = GitHubOAuth2(
    client_id=settings.oauth.github_client_id,
    client_secret=settings.oauth.github_client_secret,
)

OAUTH_CLIENTS = {
    "google": google_oauth_client,
    "github": github_oauth_client,
}
