from pydantic import BaseModel


class SearchPlanResult(BaseModel):
    id: int
    title: str
    description: str | None = None
    type: str = "plan"

    model_config = {"from_attributes": True}


class SearchBlockResult(BaseModel):
    id: int
    title: str
    content: str
    plan_id: int
    plan_title: str
    type: str = "block"

    model_config = {"from_attributes": True}


class SearchNoteResult(BaseModel):
    id: int
    title: str
    content_markdown: str
    type: str = "note"

    model_config = {"from_attributes": True}


class SearchBoardResult(BaseModel):
    id: int
    title: str
    type: str = "board"

    model_config = {"from_attributes": True}


class SearchCardResult(BaseModel):
    id: int
    title: str
    description: str | None = None
    board_id: int
    board_title: str
    column_id: int
    type: str = "card"

    model_config = {"from_attributes": True}


class SearchContactResult(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None
    type: str = "contact"

    model_config = {"from_attributes": True}


class SearchDealResult(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: str
    value: float | None = None
    contact_id: int | None = None
    contact_name: str | None = None
    type: str = "deal"

    model_config = {"from_attributes": True}


class SearchFinancialChartResult(BaseModel):
    id: int
    title: str
    description: str | None = None
    type: str = "financial_chart"

    model_config = {"from_attributes": True}


class SearchTaxEventResult(BaseModel):
    id: int
    title: str
    type: str = "tax_event"

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    plans: list[SearchPlanResult] = []
    blocks: list[SearchBlockResult] = []
    notes: list[SearchNoteResult] = []
    boards: list[SearchBoardResult] = []
    cards: list[SearchCardResult] = []
    contacts: list[SearchContactResult] = []
    deals: list[SearchDealResult] = []
    financial_charts: list[SearchFinancialChartResult] = []
    tax_events: list[SearchTaxEventResult] = []
    total: int = 0
