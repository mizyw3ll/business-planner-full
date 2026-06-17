from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.api_v1.financial.chart_point.schemas import ChartPointRead


class CurrencyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    kind: str
    is_active: bool


class FinancialChartBase(BaseModel):
    title: str
    description: str | None = None
    currency_id: int
    is_active: bool

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip()


class FinancialChartCreate(FinancialChartBase):
    pass


class FinancialChartUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    currency_id: int | None = None
    is_active: bool | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip() if v else v


class FinancialChartListItemRead(FinancialChartBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    currency: CurrencyRead


class FinancialChartRead(FinancialChartListItemRead):
    chart_points: list[ChartPointRead] = Field(default_factory=list)


class FinancialChartAnalyticsPointRead(BaseModel):
    date: datetime
    income: float
    expense: float
    net: float
    cumulative: float


class FinancialChartAnalyticsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chart_id: int
    currency_code: str
    points_count: int
    income_total: float
    expense_total: float
    net_total: float
    average_daily_net: float
    average_point_net: float
    first_point_at: datetime | None = None
    last_point_at: datetime | None = None
    series: list[FinancialChartAnalyticsPointRead] = Field(default_factory=list)
