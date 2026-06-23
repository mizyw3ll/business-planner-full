export type User = {
  id: number;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
};

export type Tag = {
  id: number;
  user_id: number;
  name: string;
  color_idx: number;
  created_at: string;
};

export type PlanBlock = {
  id: number;
  business_plan_id: number;
  title: string;
  content: string;
  block_type: string;
  rich_content?: object | null;
  media_attachments?: object[];
  linked_financial_chart_ids: number[];
  has_unpublished_draft: boolean;
  draft_saved_at?: string | null;
  tags?: Tag[];
  due_date?: string | null;
  comments_count?: number;
};

export type BusinessPlan = {
  id: number;
  user_id?: number;
  title: string;
  description?: string | null;
  blocks?: PlanBlock[];
  tags?: Tag[];
  created_at: string;
  updated_at?: string;
};

export type BusinessPlanAnalytics = {
  plan_id: number;
  blocks_count: number;
  drafts_count: number;
  comments_count: number;
  attachments_count: number;
  linked_financial_charts_count: number;
  rich_blocks_count: number;
  total_content_chars: number;
  average_content_chars: number;
  block_type_breakdown: Record<string, number>;
};

export type Template = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  blocks?: object[];
  is_public: boolean;
};

export type MediaAttachment = {
  id: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
};

export type ChartPoint = {
  id: number;
  chart_id: number;
  date: string;
  type: "income" | "expense";
  amount: string;
  description?: string | null;
};

export type FinancialPlan = {
  id: number;
  user_id?: number;
  title: string;
  description?: string | null;
  currency_id: number;
  is_active: boolean;
  chart_points?: ChartPoint[];
  created_at: string;
  updated_at?: string;
};

export type Currency = {
  id: number;
  code: string;
  name: string;
  kind: string;
  is_active: boolean;
  is_popular: boolean;
};

export type FinancialChartAnalyticsPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
};

export type FinancialChartAnalytics = {
  chart_id: number;
  currency_code: string;
  points_count: number;
  income_total: number;
  expense_total: number;
  net_total: number;
  average_daily_net: number;
  average_point_net: number;
  first_point_at?: string | null;
  last_point_at?: string | null;
  series: FinancialChartAnalyticsPoint[];
};

export type AITextResponse = {
  content: string;
  provider: string;
  model: string;
  char_count: number;
  max_chars: number;
};

export type AITextResponse = {
  content: string;
  provider: string;
  model: string;
  char_count: number;
  max_chars: number;
};

export type Project = {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  color_idx: number;
  created_at: string;
};

export type Note = {
  id: number;
  user_id: number;
  project_id?: number | null;
  title: string;
  content_markdown: string;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
};

export type PaginatedNotes = {
  items: Note[];
  total: number;
  page: number;
  per_page: number;
};

export type CalendarEvent = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  notify_before?: number[] | null;
  notified_at?: string | null;
  notified_values?: number[] | null;
  event_type: string;
  related_plan_id?: number | null;
  related_block_id?: number | null;
  related_note_id?: number | null;
  created_at: string;
};

export type CalendarImportResult = {
  imported: number;
  skipped: number;
  errors: number;
  details: string[];
};

export type DashboardPlanItem = {
  id: number;
  title: string;
  description?: string | null;
  block_count: number;
  created_at: string;
};

export type DashboardChartItem = {
  id: number;
  title: string;
  point_count: number;
  created_at: string;
};

export type DashboardNoteItem = {
  id: number;
  title: string;
  created_at: string;
};

export type DashboardData = {
  plan_count: number;
  chart_count: number;
  note_count: number;
  block_count: number;
  recent_plans: DashboardPlanItem[];
  recent_charts: DashboardChartItem[];
  recent_notes: DashboardNoteItem[];
};

export type SearchPlanResult = {
  id: number;
  title: string;
  description?: string | null;
  type: "plan";
};

export type SearchBlockResult = {
  id: number;
  title: string;
  content: string;
  plan_id: number;
  plan_title: string;
  type: "block";
};

export type SearchNoteResult = {
  id: number;
  title: string;
  content_markdown: string;
  type: "note";
};

export type SearchBoardResult = {
  id: number;
  title: string;
  type: "board";
};

export type SearchCardResult = {
  id: number;
  title: string;
  description: string | null;
  board_id: number;
  board_title: string;
  column_id: number;
  type: "card";
};

export type SearchContactResult = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  type: "contact";
};

export type SearchDealResult = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  value: number | null;
  contact_id?: number | null;
  contact_name?: string | null;
  type: "deal";
};

export type SearchFinancialChartResult = {
  id: number;
  title: string;
  description?: string | null;
  type: "financial_chart";
};

export type SearchTaxEventResult = {
  id: number;
  title: string;
  type: "tax_event";
};

export type SearchResults = {
  plans: SearchPlanResult[];
  blocks: SearchBlockResult[];
  notes: SearchNoteResult[];
  boards: SearchBoardResult[];
  cards: SearchCardResult[];
  contacts: SearchContactResult[];
  deals: SearchDealResult[];
  financial_charts: SearchFinancialChartResult[];
  tax_events: SearchTaxEventResult[];
  total: number;
};

export type TaxEvent = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  event_type: string;
  amount?: number | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  is_completed: boolean;
  notify_before?: number[] | null;
  notified_at?: string | null;
  notified_values?: number[] | null;
  created_at: string;
  updated_at: string;
};

export type AppNotification = {
  id: number;
  user_id?: number;
  title: string;
  body?: string | null;
  source_type: string;
  source_id?: number | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationSSEEvent = {
  type: "notification" | "connected";
  id?: number;
  title?: string;
  body?: string | null;
  source_type?: string;
  source_id?: number | null;
  is_read?: boolean;
  created_at?: string;
};

export type BoardCard = {
  id: number;
  column_id: number;
  title: string;
  description?: string | null;
  card_order: number;
  metadata_json?: Record<string, unknown> | null;
};

export type BoardColumn = {
  id: number;
  board_id: number;
  title: string;
  color?: string | null;
  column_order: number;
  cards: BoardCard[];
};

export type Board = {
  id: number;
  user_id: number;
  title: string;
  business_plan_id?: number;
  created_at: string;
  updated_at: string;
};

export type BoardListItem = {
  id: number;
  title: string;
  business_plan_id?: number;
  created_at: string;
};

export type Contact = {
  id: number;
  user_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  is_lead: boolean;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: number;
  user_id: number;
  contact_id?: number | null;
  title: string;
  description?: string | null;
  status: string;
  value?: number | null;
  currency: string;
  priority: string;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
};

export type PipelineStats = {
  total_deals: number;
  total_value: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
};
