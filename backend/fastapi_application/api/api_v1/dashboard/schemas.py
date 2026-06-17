from pydantic import BaseModel


class DashboardPlanItem(BaseModel):
    id: int
    title: str
    description: str | None = None
    block_count: int = 0
    created_at: str

    model_config = {"from_attributes": True}


class DashboardChartItem(BaseModel):
    id: int
    title: str
    point_count: int = 0
    created_at: str

    model_config = {"from_attributes": True}


class DashboardNoteItem(BaseModel):
    id: int
    title: str
    created_at: str

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    plan_count: int = 0
    chart_count: int = 0
    note_count: int = 0
    block_count: int = 0
    recent_plans: list[DashboardPlanItem] = []
    recent_charts: list[DashboardChartItem] = []
    recent_notes: list[DashboardNoteItem] = []
