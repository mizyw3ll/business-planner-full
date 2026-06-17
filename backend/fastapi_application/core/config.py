import os

from pydantic import BaseModel, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class RunConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8000


class CorsConfig(BaseModel):
    allow_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]


class ApiV1Prefix(BaseModel):
    prefix: str = "/v1"
    auth: str = "/auth"
    users: str = "/users"
    messages: str = "/messages"

    # группы
    business_plan: str = "/business"
    financial: str = "/financial"


class NestedResources(BaseModel):
    plans: str = "/plans"  # → /business/plans/
    blocks: str = "/blocks"  # → /business/plans/{id}/blocks/
    charts: str = "/charts"  # → /financial/charts/
    points: str = "/points"  # → /financial/charts/{id}/points/


class ApiPrefix(BaseModel):
    prefix: str = "/api"
    v1: ApiV1Prefix = ApiV1Prefix()
    nested: NestedResources = NestedResources()

    @property
    def bearer_token_url(self) -> str:
        # /login добавляется само -> api/v1/auth/login
        parts = (self.prefix, self.v1.prefix, self.v1.auth, "/login")
        path = "".join(parts)
        # return path[:1]
        return path.removeprefix("/")

    # @property
    # def bearer_token_url(self) -> str:
    #     """Относительный путь для OAuth2PasswordRequestForm"""
    #     return f"{self.v1.auth}/login".lstrip("/")
    #
    # @property
    # def full_prefix(self) -> str:
    #     return f"{self.prefix}{self.v1.prefix}"


class DatabaseConfig(BaseModel):
    url: PostgresDsn = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"  # type: ignore[assignment]
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10

    naming_conventions: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_N_name)s",
        "ck": "ck_%(table_name)s_%(column_0_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }


class AccessToken(BaseModel):
    lifetime_seconds: int = 86400 * 5
    reset_password_token_secret: str = ""
    verification_token_secret: str = ""


class EmailConfig(BaseModel):
    # Provider selection: smtp, sendgrid, console (for dev)
    provider: str = "console"
    from_email: str = "noreply@example.com"
    from_name: str = "Business Planner"

    # SMTP settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True

    # SendGrid settings
    sendgrid_api_key: str = ""

    # Resend settings
    resend_api_key: str = ""

    # Template settings
    frontend_url: str = "http://localhost:3000"


class CurrencySyncConfig(BaseModel):
    enabled: bool = True
    interval_minutes: int = 60
    quote_code: str = "USD"


class AIConfig(BaseModel):
    provider: str = "disabled"
    base_url: str = "http://localhost:11434"
    api_key: str = ""
    model: str = "qwen2.5:3b"
    timeout_seconds: int = 60
    temperature: float = 0.2
    max_tokens: int = 1200
    max_chars: int = 5000
    system_prompt: str = "Ты помощник для Конструктора бизнес-планов. Отвечай кратко, структурно и без лишней воды."


class S3Config(BaseModel):
    enabled: bool = False
    endpoint_url: str = "https://s3.cloud.ru"
    bucket: str = ""
    access_key: str = ""
    secret_key: str = ""
    region: str = "ru-central-1"
    max_file_size: int = 10 * 1024 * 1024  # 10 MB


class OAuthConfig(BaseModel):
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    google_state_secret: str = ""
    github_state_secret: str = ""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
        extra="ignore",
    )
    run: RunConfig = RunConfig()
    api: ApiPrefix = ApiPrefix()
    cors: CorsConfig = CorsConfig()
    db: DatabaseConfig
    access_token: AccessToken
    email: EmailConfig = EmailConfig()
    oauth: OAuthConfig = OAuthConfig()
    ai: AIConfig = AIConfig()
    s3: S3Config = S3Config()
    currency_sync: CurrencySyncConfig = CurrencySyncConfig()

    def __post_init__(self):
        missing = []
        if not self.access_token.reset_password_token_secret:
            missing.append("APP_CONFIG__ACCESS_TOKEN__RESET_PASSWORD_TOKEN_SECRET")
        if not self.access_token.verification_token_secret:
            missing.append("APP_CONFIG__ACCESS_TOKEN__VERIFICATION_TOKEN_SECRET")
        if missing:
            raise ValueError(f"Не заданы обязательные секреты: {', '.join(missing)}. Установите их в .env файле.")


settings = Settings()  # type: ignore[call-arg]
