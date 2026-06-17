import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  Briefcase,
  Layout,
  FileText,
  Columns,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";
import { useSearchQuery } from "../hooks/useCachedData";
import { inputStyle, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

export function SearchBar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading } = useSearchQuery(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onNavigate?.();
      setQuery("");
    }
  }

  function handleResultClick(path: string) {
    navigate(path);
    onNavigate?.();
    setQuery("");
  }

  const hasResults = results && results.total > 0;
  const showDropdown = debouncedQuery.length >= 1 && (isLoading || hasResults);

  function highlightText(text: string) {
    if (!debouncedQuery) return text;
    const parts = text.split(new RegExp(`(${debouncedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === debouncedQuery.toLowerCase() ? (
        <span key={i} className="font-bold" style={{ color: "rgba(99,102,241,0.9)" }}>
          {part}
        </span>
      ) : (
        part
      ),
    );
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: v("text-tertiary") }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle(isDark)}
          />
          {isLoading && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
              style={{ color: v("text-tertiary") }}
            />
          )}
        </div>
      </form>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border py-1"
          style={{
            background: v("bg-secondary"),
            borderColor: v("border-primary"),
          }}
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm" style={{ color: v("text-tertiary") }}>
              Поиск...
            </div>
          )}

          {!isLoading && results && (
            <>
              {results.plans.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <Briefcase size={12} />
                    Бизнес-планы
                  </div>
                  {results.plans.map((plan) => (
                    <button
                      key={`plan-${plan.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/business-plans/${plan.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(plan.title)}
                    </button>
                  ))}
                </div>
              )}

              {results.blocks.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <Layout size={12} />
                    Блоки
                  </div>
                  {results.blocks.map((block) => (
                    <button
                      key={`block-${block.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/business-plans/${block.plan_id}#block-${block.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      <span className="font-medium">{highlightText(block.title)}</span>
                      <span className="ml-2 text-xs" style={{ color: v("text-tertiary") }}>
                        ({block.plan_title})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.notes.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <FileText size={12} />
                    Заметки
                  </div>
                  {results.notes.map((note) => (
                    <button
                      key={`note-${note.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/notes?noteId=${note.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(note.title)}
                    </button>
                  ))}
                </div>
              )}

              {results.boards.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <Columns size={12} />
                    Доски
                  </div>
                  {results.boards.map((board) => (
                    <button
                      key={`board-${board.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/kanban?boardId=${board.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(board.title)}
                    </button>
                  ))}
                </div>
              )}

              {results.cards.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <Layout size={12} />
                    Карточки
                  </div>
                  {results.cards.map((card) => (
                    <button
                      key={`card-${card.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/kanban?boardId=${card.board_id}&cardId=${card.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      <span className="font-medium">{highlightText(card.title)}</span>
                      <span className="ml-2 text-xs" style={{ color: v("text-tertiary") }}>
                        ({card.board_title})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.contacts.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <User size={12} />
                    Контакты
                  </div>
                  {results.contacts.map((contact) => (
                    <button
                      key={`contact-${contact.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/crm?contactId=${contact.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(contact.name)}
                      {contact.company && (
                        <span className="ml-2 text-xs" style={{ color: v("text-tertiary") }}>
                          {contact.company}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.deals.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <DollarSign size={12} />
                    Сделки
                  </div>
                  {results.deals.map((deal) => (
                    <button
                      key={`deal-${deal.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/crm?dealId=${deal.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      <span className="font-medium">{highlightText(deal.title)}</span>
                      {deal.contact_name && (
                        <span className="ml-2 text-xs" style={{ color: v("text-tertiary") }}>
                          {deal.contact_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.financial_charts.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <TrendingUp size={12} />
                    Финансовые планы
                  </div>
                  {results.financial_charts.map((chart) => (
                    <button
                      key={`chart-${chart.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/financial-plans/${chart.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(chart.title)}
                    </button>
                  ))}
                </div>
              )}

              {results.tax_events.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                    style={{ color: v("text-tertiary") }}
                  >
                    <Calendar size={12} />
                    Налоговые события
                  </div>
                  {results.tax_events.map((event) => (
                    <button
                      key={`tax-event-${event.id}`}
                      type="button"
                      onClick={() => handleResultClick(`/tax-calendar?eventId=${event.id}`)}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: v("text-primary") }}
                    >
                      {highlightText(event.title)}
                    </button>
                  ))}
                </div>
              )}

              {!hasResults && (
                <div className="flex items-center gap-1.5 px-3 py-4 text-sm" style={{ color: v("text-tertiary") }}>
                  <Search size={14} />
                  Ничего не найдено
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
