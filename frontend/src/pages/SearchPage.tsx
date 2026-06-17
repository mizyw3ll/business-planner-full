import { useSearchParams, Link } from "react-router-dom";
import { ScrollText, FileText, Loader2, Columns, Layout, User, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useSearchQuery } from "../hooks/useCachedData";
import { cardStyle, tw, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

export function SearchPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: results, isLoading } = useSearchQuery(query);

  return (
    <div className={`${tw.pageContainer} animate-fade-in`}>
      <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
        Результаты поиска
      </h1>

      {query && (
        <p className="text-sm" style={{ color: v("text-tertiary") }}>
          Запрос: "{query}"
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2" style={{ color: v("text-tertiary") }}>
          <Loader2 size={16} className="animate-spin" />
          Поиск...
        </div>
      )}

      {!isLoading && results && results.total === 0 && (
        <p className="text-sm" style={{ color: v("text-tertiary") }}>
          Ничего не найдено
        </p>
      )}

      {!isLoading && results && (
        <div className="space-y-6">
          {results.plans.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Бизнес-планы ({results.plans.length})
              </h2>
              <div className="space-y-2">
                {results.plans.map((plan) => (
                  <Link
                    key={`plan-${plan.id}`}
                    to={`/business-plans/${plan.id}`}
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <ScrollText size={18} style={{ color: v("text-secondary") }} />
                    <div>
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {plan.title}
                      </p>
                      {plan.description && (
                        <p className="text-sm line-clamp-1" style={{ color: v("text-tertiary") }}>
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.blocks.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Блоки ({results.blocks.length})
              </h2>
              <div className="space-y-2">
                {results.blocks.map((block) => (
                  <Link
                    key={`block-${block.id}`}
                    to={`/business-plans/${block.plan_id}#block-${block.id}`}
                    className="block rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {block.title}
                      </p>
                      <span className="text-xs" style={{ color: v("text-tertiary") }}>
                        ({block.plan_title})
                      </span>
                    </div>
                    {block.content && (
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: v("text-tertiary") }}>
                        {block.content}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.notes.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Заметки ({results.notes.length})
              </h2>
              <div className="space-y-2">
                {results.notes.map((note) => (
                  <Link
                    key={`note-${note.id}`}
                    to={`/notes?noteId=${note.id}`}
                    className="block rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("note", isDark)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={18} style={{ color: v("text-secondary") }} />
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {note.title}
                      </p>
                    </div>
                    {note.content_markdown && (
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: v("text-tertiary") }}>
                        {note.content_markdown}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.boards.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Доски ({results.boards.length})
              </h2>
              <div className="space-y-2">
                {results.boards.map((board) => (
                  <Link
                    key={`board-${board.id}`}
                    to={`/kanban?boardId=${board.id}`}
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <Columns size={18} style={{ color: v("text-secondary") }} />
                    <p className="font-medium" style={{ color: v("text-primary") }}>
                      {board.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.cards.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Карточки ({results.cards.length})
              </h2>
              <div className="space-y-2">
                {results.cards.map((card) => (
                  <Link
                    key={`card-${card.id}`}
                    to={`/kanban?boardId=${card.board_id}&cardId=${card.id}`}
                    className="block rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <div className="flex items-center gap-2">
                      <Layout size={18} style={{ color: v("text-secondary") }} />
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {card.title}
                      </p>
                      <span className="text-xs" style={{ color: v("text-tertiary") }}>
                        ({card.board_title})
                      </span>
                    </div>
                    {card.description && (
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: v("text-tertiary") }}>
                        {card.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.contacts.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Контакты ({results.contacts.length})
              </h2>
              <div className="space-y-2">
                {results.contacts.map((contact) => (
                  <Link
                    key={`contact-${contact.id}`}
                    to={`/crm?contactId=${contact.id}`}
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <User size={18} style={{ color: v("text-secondary") }} />
                    <div>
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {contact.name}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm" style={{ color: v("text-tertiary") }}>
                        {contact.company && <span>{contact.company}</span>}
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.deals.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Сделки ({results.deals.length})
              </h2>
              <div className="space-y-2">
                {results.deals.map((deal) => (
                  <Link
                    key={`deal-${deal.id}`}
                    to={`/crm?dealId=${deal.id}`}
                    className="block rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} style={{ color: v("text-secondary") }} />
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {deal.title}
                      </p>
                      {deal.contact_name && (
                        <span className="text-xs" style={{ color: v("text-tertiary") }}>
                          ({deal.contact_name})
                        </span>
                      )}
                    </div>
                    {deal.description && (
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: v("text-tertiary") }}>
                        {deal.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.financial_charts.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Финансовые планы ({results.financial_charts.length})
              </h2>
              <div className="space-y-2">
                {results.financial_charts.map((chart) => (
                  <Link
                    key={`chart-${chart.id}`}
                    to={`/financial-plans/${chart.id}`}
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("financial", isDark)}
                  >
                    <TrendingUp size={18} style={{ color: v("text-secondary") }} />
                    <div>
                      <p className="font-medium" style={{ color: v("text-primary") }}>
                        {chart.title}
                      </p>
                      {chart.description && (
                        <p className="text-sm line-clamp-1" style={{ color: v("text-tertiary") }}>
                          {chart.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.tax_events.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
                Налоговые события ({results.tax_events.length})
              </h2>
              <div className="space-y-2">
                {results.tax_events.map((event) => (
                  <Link
                    key={`tax-event-${event.id}`}
                    to={`/tax-calendar?eventId=${event.id}`}
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5"
                    style={cardStyle("business", isDark)}
                  >
                    <Calendar size={18} style={{ color: v("text-secondary") }} />
                    <p className="font-medium" style={{ color: v("text-primary") }}>
                      {event.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
