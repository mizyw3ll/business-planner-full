# api/api_v1/auth/schemas.py
import re
from datetime import datetime

from core.types.user_id import UserIdType
from fastapi_users import schemas
from pydantic import BaseModel, Field, field_validator, model_validator

# ═══════════════════════════════════════════════════════════════
# Валидатор username (вынесен для переиспользования)
# ═══════════════════════════════════════════════════════════════

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")
MIN_USERNAME_LEN = 5
MAX_USERNAME_LEN = 32  # Согласовано с моделью (String(32))


def validate_username_logic(v: str | None) -> str | None:
    """Чистая функция валидации для переиспользования."""
    if v is None:
        return None

    v = v.strip()

    if not v:
        raise ValueError("Имя пользователя не может быть пустым")

    if not MIN_USERNAME_LEN <= len(v) <= MAX_USERNAME_LEN:
        raise ValueError(f"Длина от {MIN_USERNAME_LEN} до {MAX_USERNAME_LEN} символов")

    if not USERNAME_PATTERN.match(v):
        raise ValueError("Только буквы, цифры, подчёркивание и дефис")

    if v.startswith(("_", "-")) or v.endswith(("_", "-")):
        raise ValueError("Не может начинаться или заканчиваться на _ или -")

    if "__" in v or "--" in v:
        raise ValueError("Запрещены последовательные _ или -")

    return v.lower()


# ═══════════════════════════════════════════════════════════════
# Схемы чтения
# ═══════════════════════════════════════════════════════════════


class UserRead(schemas.BaseUser[UserIdType]):
    """
    Схема для отдачи данных пользователя.
    is_superuser скрыт из ответа (безопасность).
    """

    username: str
    first_name: str | None = None
    last_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = schemas.BaseUser.model_config.copy()
    model_config["json_schema_extra"] = {
        "exclude": ["is_superuser"],
    }


# ═══════════════════════════════════════════════════════════════
# Схемы создания
# ═══════════════════════════════════════════════════════════════


class UserCreate(schemas.BaseUserCreate):
    """
    Схема регистрации.
    is_superuser, is_verified, is_active принудительно установлены —
    пользователь не может назначить их сам (защита от mass assignment).
    """

    username: str = Field(..., min_length=MIN_USERNAME_LEN, max_length=MAX_USERNAME_LEN)
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)
    is_active: bool = Field(default=True, exclude=True)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        result = validate_username_logic(v)
        if result is None:
            raise ValueError("Username обязателен")
        return result

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None


# ═══════════════════════════════════════════════════════════════
# Схемы обновления
# ═══════════════════════════════════════════════════════════════


class UserUpdate(schemas.BaseUserUpdate):
    """
    Схема обновления профиля.
    is_superuser, is_verified, is_active исключены — нельзя назначить самому себе.
    """

    username: str | None = Field(None, min_length=MIN_USERNAME_LEN, max_length=MAX_USERNAME_LEN)
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)
    is_active: bool = Field(default=True, exclude=True)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        return validate_username_logic(v)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None


# ═══════════════════════════════════════════════════════════════
# Схема смены пароля
# ═══════════════════════════════════════════════════════════════


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

    @model_validator(mode="after")
    def check_passwords_different(self):
        old = self.old_password
        new = self.new_password
        if old == new:
            raise ValueError("Новый пароль должен отличаться от старого")
        # Простая проверка схожести: если новый содержит старый или наоборот
        if old.lower() in new.lower() or new.lower() in old.lower():
            raise ValueError("Новый пароль слишком похож на старый")
        return self
