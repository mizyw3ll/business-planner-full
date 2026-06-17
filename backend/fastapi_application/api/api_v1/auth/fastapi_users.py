from core.models import User
from core.types.user_id import UserIdType
from fastapi_users import FastAPIUsers

from api.dependencies.authentication import authentication_backend, get_user_manager

fastapi_users = FastAPIUsers[User, UserIdType](  # type: ignore[type-var]
    get_user_manager,
    [authentication_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_active_super_user = fastapi_users.current_user(active=True, superuser=True)
current_user_optional = fastapi_users.current_user(active=True, optional=True)
