import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  Target,
  TrendingUp,
  Users,
  Search,
  ChevronDown,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createContactApi,
  updateContactApi,
  deleteContactApi,
  createDealApi,
  updateDealApi,
  deleteDealApi,
  type Contact,
  type Deal,
} from "../api";
import { cardStyle, inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { getCurrencySymbol } from "../shared/currency";
import { useTheme } from "../features/theme/ThemeContext";
import { useContactsQuery, useDealsQuery, usePipelineStatsQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { ConfirmModal } from "../components/ConfirmModal";
import { useModalRegistration } from "../hooks/useModalOpen";
import { DEAL_STATUSES, PRIORITIES, type Tab } from "./crm/CrmPage.constants";
import { ContactFormModal } from "./crm/ContactFormModal";
import { DealFormModal } from "./crm/DealFormModal";
import { PipelineView } from "./crm/PipelineView";

export function CrmPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const qc = useQueryClient();
  const { data: contacts = [] } = useContactsQuery();
  const { data: deals = [] } = useDealsQuery();
  const { data: stats } = usePipelineStatsQuery();

  const [tab, setTab] = useState<Tab>("contacts");
  const [showContactForm, setShowContactForm] = useState(false);
  useModalRegistration(showContactForm);
  const [showDealForm, setShowDealForm] = useState(false);
  useModalRegistration(showDealForm);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cPosition, setCPosition] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cIsLead, setCIsLead] = useState(false);

  const [dTitle, setDTitle] = useState("");
  const [dDescription, setDDescription] = useState("");
  const [dContactId, setDContactId] = useState("");
  const [dStatus, setDStatus] = useState("new");
  const [dValue, setDValue] = useState("");
  const [dCurrency, setDCurrency] = useState("RUB");
  const [dPriority, setDPriority] = useState("medium");
  const [dDueDate, setDDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contactSortBy, setContactSortBy] = useState("name_asc");
  const [dealSortBy, setDealSortBy] = useState("value_desc");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "contact" | "deal"; id: number; title: string } | null>(
    null,
  );
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [dealErrors, setDealErrors] = useState<Record<string, string>>({});

  const filteredContacts = useMemo(() => {
    const list = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
    list.sort((a, b) => {
      if (contactSortBy === "name_asc") return a.name.localeCompare(b.name);
      if (contactSortBy === "name_desc") return b.name.localeCompare(a.name);
      if (contactSortBy === "created_at_asc")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [contacts, searchQuery, contactSortBy]);

  const filteredDeals = useMemo(() => {
    const list = deals.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a, b) => {
      if (dealSortBy === "value_asc") return (a.value || 0) - (b.value || 0);
      if (dealSortBy === "value_desc") return (b.value || 0) - (a.value || 0);
      if (dealSortBy === "created_at_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [deals, searchQuery, dealSortBy]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const contactIdParam = searchParams.get("contactId");
    const dealIdParam = searchParams.get("dealId");
    if (contactIdParam) {
      setTab("contacts"); // eslint-disable-line react-hooks/set-state-in-effect
      const found = contacts.find((c) => c.id === Number(contactIdParam));
      if (found) {
        setEditingContact(found);
        setCName(found.name);
        setCEmail(found.email || "");
        setCPhone(found.phone || "");
        setCCompany(found.company || "");
        setCPosition(found.position || "");
        setCNotes(found.notes || "");
        setCIsLead(found.is_lead);
        setShowContactForm(true);
      }
    } else if (dealIdParam) {
      setTab("deals");
      const found = deals.find((d) => d.id === Number(dealIdParam));
      if (found) {
        setEditingDeal(found);
        setDTitle(found.title);
        setDDescription(found.description || "");
        setDContactId(found.contact_id?.toString() || "");
        setDStatus(found.status);
        setDValue(found.value?.toString() || "");
        setDCurrency(found.currency);
        setDPriority(found.priority);
        setDDueDate(found.due_date || "");
        setShowDealForm(true);
      }
    }
  }, [searchParams, contacts, deals]);

  const createContactMut = useMutation({
    mutationFn: () =>
      createContactApi({
        name: cName,
        email: cEmail || undefined,
        phone: cPhone || undefined,
        company: cCompany || undefined,
        position: cPosition || undefined,
        notes: cNotes || undefined,
        is_lead: cIsLead,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts() });
      resetContactForm();
      setShowContactForm(false);
      toast.success("Контакт создан");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при создании контакта"),
  });

  const updateContactMut = useMutation({
    mutationFn: () =>
      updateContactApi(editingContact!.id, {
        name: cName,
        email: cEmail || undefined,
        phone: cPhone || undefined,
        company: cCompany || undefined,
        position: cPosition || undefined,
        notes: cNotes || undefined,
        is_lead: cIsLead,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts() });
      resetContactForm();
      setShowContactForm(false);
      setEditingContact(null);
      toast.success("Контакт обновлён");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при обновлении"),
  });

  const deleteContactMut = useMutation({
    mutationFn: deleteContactApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts() });
      toast.success("Контакт удалён");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при удалении"),
  });

  const createDealMut = useMutation({
    mutationFn: () =>
      createDealApi({
        title: dTitle,
        description: dDescription || undefined,
        contact_id: dContactId ? Number(dContactId) : undefined,
        status: dStatus,
        value: dValue ? Number(dValue) : undefined,
        currency: dCurrency,
        priority: dPriority,
        due_date: dDueDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals() });
      qc.invalidateQueries({ queryKey: queryKeys.pipelineStats });
      resetDealForm();
      setShowDealForm(false);
      toast.success("Сделка создана");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при создании сделки"),
  });

  const updateDealMut = useMutation({
    mutationFn: () =>
      updateDealApi(editingDeal!.id, {
        title: dTitle,
        description: dDescription || undefined,
        contact_id: dContactId ? Number(dContactId) : undefined,
        status: dStatus,
        value: dValue ? Number(dValue) : undefined,
        currency: dCurrency,
        priority: dPriority,
        due_date: dDueDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals() });
      qc.invalidateQueries({ queryKey: queryKeys.pipelineStats });
      resetDealForm();
      setShowDealForm(false);
      setEditingDeal(null);
      toast.success("Сделка обновлена");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при обновлении"),
  });

  const deleteDealMut = useMutation({
    mutationFn: deleteDealApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals() });
      qc.invalidateQueries({ queryKey: queryKeys.pipelineStats });
      toast.success("Сделка удалена");
    },
    onError: (err: any) => toast.error(err?.userMessage || "Ошибка при удалении"),
  });

  function resetContactForm() {
    setCName("");
    setCEmail("");
    setCPhone("");
    setCCompany("");
    setCPosition("");
    setCNotes("");
    setCIsLead(false);
    setContactErrors({});
  }

  function resetDealForm() {
    setDTitle("");
    setDDescription("");
    setDContactId("");
    setDStatus("new");
    setDValue("");
    setDCurrency("RUB");
    setDPriority("medium");
    setDDueDate("");
    setDealErrors({});
  }

  function validateContactForm(): boolean {
    const errors: Record<string, string> = {};
    const name = cName.trim();
    if (!name) {
      errors.name = "Обязательное поле";
    } else if (name.length < 2) {
      errors.name = "Минимум 2 символа";
    } else if (name.length > 100) {
      errors.name = "Максимум 100 символов";
    }

    const email = cEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Некорректный email";
    }

    const phone = cPhone.trim();
    if (phone && !/^[\d\s\-+()]{7,20}$/.test(phone)) {
      errors.phone = "Некорректный телефон";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateDealForm(): boolean {
    const errors: Record<string, string> = {};
    const title = dTitle.trim();
    if (!title) {
      errors.title = "Обязательное поле";
    } else if (title.length < 2) {
      errors.title = "Минимум 2 символа";
    } else if (title.length > 200) {
      errors.title = "Максимум 200 символов";
    }

    if (dValue) {
      const num = Number(dValue);
      if (isNaN(num) || num < 0) {
        errors.value = "Только положительные числа";
      } else if (num > 999999999) {
        errors.value = "Слишком большая сумма";
      }
    }

    if (dDueDate) {
      const date = new Date(dDueDate);
      if (isNaN(date.getTime())) {
        errors.dueDate = "Некорректная дата";
      }
    }

    setDealErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openEditContact(c: Contact) {
    setEditingContact(c);
    setCName(c.name);
    setCEmail(c.email || "");
    setCPhone(c.phone || "");
    setCCompany(c.company || "");
    setCPosition(c.position || "");
    setCNotes(c.notes || "");
    setCIsLead(c.is_lead);
    setShowContactForm(true);
  }

  function openEditDeal(d: Deal) {
    setEditingDeal(d);
    setDTitle(d.title);
    setDDescription(d.description || "");
    setDContactId(d.contact_id?.toString() || "");
    setDStatus(d.status);
    setDValue(d.value?.toString() || "");
    setDCurrency(d.currency);
    setDPriority(d.priority);
    setDDueDate(d.due_date || "");
    setShowDealForm(true);
  }

  function getStatusColor(status: string) {
    return DEAL_STATUSES.find((s) => s.value === status)?.color || "#9ca3af";
  }

  function getPriorityColor(priority: string) {
    return PRIORITIES.find((p) => p.value === priority)?.color || "#9ca3af";
  }

  function getStatusLabel(status: string) {
    return DEAL_STATUSES.find((s) => s.value === status)?.label || status;
  }

  function getPriorityLabel(priority: string) {
    return PRIORITIES.find((p) => p.value === priority)?.label || priority;
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "contact") {
      deleteContactMut.mutate(deleteTarget.id);
    } else {
      deleteDealMut.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  }

  return (
    <>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={
          deleteTarget
            ? `Вы действительно хотите удалить ${deleteTarget.type === "contact" ? "контакт" : "сделку"} "${
                deleteTarget.title
              }"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
      <div className={tw.pageContainer}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>CRM</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { resetContactForm(); setEditingContact(null); setShowContactForm(true); }}
              className={`${tw.buttonPrimary} flex items-center gap-2`}
            >
              <Plus size={16} /> Контакт
            </button>
            <button
              type="button"
              onClick={() => { resetDealForm(); setEditingDeal(null); setShowDealForm(true); }}
              className={`${tw.buttonPrimary} flex items-center gap-2`}
            >
              <Plus size={16} /> Сделка
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {(["contacts", "deals", "pipeline"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-300 active:scale-[0.96] ${
                tab === t
                  ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 border-transparent"
                  : "border-2 hover:bg-indigo-500/10"
              }`}
              style={tab !== t ? { borderColor: v("border-primary"), color: v("text-primary") } : {}}
            >
              {t === "contacts" && <><Users size={18} /> Контакты ({contacts.length})</>}
              {t === "deals" && <><Target size={18} /> Сделки ({deals.length})</>}
              {t === "pipeline" && <><TrendingUp size={18} /> Воронка</>}
            </button>
          ))}
        </div>

        {tab === "contacts" && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: v("text-tertiary") }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени или компании..."
                  className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
                  style={inputStyle(isDark)}
                />
              </div>
              <div className="relative">
                <select
                  value={contactSortBy}
                  onChange={(e) => setContactSortBy(e.target.value)}
                  className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
                  style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
                >
                  <option value="name_asc">По имени (А→Я)</option>
                  <option value="name_desc">По имени (Я→А)</option>
                  <option value="created_at_desc">Сначала новые</option>
                  <option value="created_at_asc">Сначала старые</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: v("text-muted") }} />
              </div>
            </div>
            {filteredContacts.length === 0 ? (
              <p className="text-sm" style={{ color: v("text-muted") }}>{searchQuery ? "Ничего не найдено" : "Нет контактов"}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact: Contact, i) => (
                  <div
                    key={contact.id}
                    className={`animate-fade-in stagger-${(i % 6) + 1} rounded-xl border p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5`}
                    style={cardStyle("note", isDark)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: v("bg-tertiary") }}>
                          <User size={18} style={{ color: v("text-muted") }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: v("text-primary") }}>{contact.name}</p>
                          {contact.company && (
                            <p className="text-sm flex items-center gap-1" style={{ color: v("text-muted") }}>
                              <Building2 size={12} /> {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                      {contact.is_lead && (
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "#3b82f6", color: "#fff" }}>Лид</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      {contact.email && (
                        <p className="text-sm flex items-center gap-1" style={{ color: v("text-muted") }}><Mail size={12} /> {contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-sm flex items-center gap-1" style={{ color: v("text-muted") }}><Phone size={12} /> {contact.phone}</p>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => openEditContact(contact)} className="rounded-lg px-3 py-1 text-xs font-medium transition-colors" style={buttonStyle("secondary", isDark)}>Изменить</button>
                      <button type="button" onClick={() => setDeleteTarget({ type: "contact", id: contact.id, title: contact.name })} className="rounded-lg px-3 py-1 text-xs font-medium transition-colors" style={buttonStyle("danger", isDark)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "deals" && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: v("text-tertiary") }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию..."
                  className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
                  style={inputStyle(isDark)}
                />
              </div>
              <div className="relative">
                <select
                  value={dealSortBy}
                  onChange={(e) => setDealSortBy(e.target.value)}
                  className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
                  style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
                >
                  <option value="value_desc">По сумме (сначала большие)</option>
                  <option value="value_asc">По сумме (сначала малые)</option>
                  <option value="created_at_desc">Сначала новые</option>
                  <option value="created_at_asc">Сначала старые</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: v("text-muted") }} />
              </div>
            </div>
            {filteredDeals.length === 0 ? (
              <p className="text-sm" style={{ color: v("text-muted") }}>{searchQuery ? "Ничего не найдено" : "Нет сделок"}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeals.map((deal: Deal, i) => (
                  <div
                    key={deal.id}
                    className={`animate-fade-in stagger-${(i % 6) + 1} rounded-xl border p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5`}
                    style={cardStyle("note", isDark)}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: v("text-primary") }}>{deal.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ background: getStatusColor(deal.status) }}>{getStatusLabel(deal.status)}</span>
                        <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ background: getPriorityColor(deal.priority) }}>{getPriorityLabel(deal.priority)}</span>
                      </div>
                    </div>
                    {deal.value != null && (
                      <p className="mt-2 text-sm font-medium flex items-center gap-1" style={{ color: v("text-primary") }}>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{getCurrencySymbol(deal.currency)}</span>
                        {deal.value.toLocaleString()} {deal.currency}
                      </p>
                    )}
                    {deal.contact && (
                      <p className="text-sm mt-1 flex items-center gap-1" style={{ color: v("text-muted") }}><User size={12} /> {deal.contact.name}</p>
                    )}
                    {deal.due_date && (
                      <p className="text-sm mt-1 flex items-center gap-1" style={{ color: v("text-muted") }}><Calendar size={12} /> {deal.due_date}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => openEditDeal(deal)} className="rounded-lg px-3 py-1 text-xs font-medium transition-colors" style={buttonStyle("secondary", isDark)}>Изменить</button>
                      <button type="button" onClick={() => setDeleteTarget({ type: "deal", id: deal.id, title: deal.title })} className="rounded-lg px-3 py-1 text-xs font-medium transition-colors" style={buttonStyle("danger", isDark)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "pipeline" && <PipelineView stats={stats} isDark={isDark} />}
      </div>

      {showContactForm && (
        <ContactFormModal
          isDark={isDark}
          editingContact={editingContact}
          cName={cName} cEmail={cEmail} cPhone={cPhone} cCompany={cCompany}
          cPosition={cPosition} cNotes={cNotes} cIsLead={cIsLead}
          contactErrors={contactErrors}
          isPending={createContactMut.isPending || updateContactMut.isPending}
          onNameChange={setCName} onEmailChange={setCEmail} onPhoneChange={setCPhone}
          onCompanyChange={setCCompany} onPositionChange={setCPosition}
          onNotesChange={setCNotes} onIsLeadChange={setCIsLead}
          onClearError={(f) => setContactErrors((p) => { const n = { ...p }; delete n[f]; return n; })}
          onSave={() => { if (validateContactForm()) { editingContact ? updateContactMut.mutate() : createContactMut.mutate(); } }}
          onClose={() => { setShowContactForm(false); setEditingContact(null); }}
        />
      )}

      {showDealForm && (
        <DealFormModal
          isDark={isDark}
          editingDeal={editingDeal}
          dTitle={dTitle} dDescription={dDescription} dContactId={dContactId}
          dStatus={dStatus} dValue={dValue} dCurrency={dCurrency}
          dPriority={dPriority} dDueDate={dDueDate}
          dealErrors={dealErrors}
          contacts={contacts}
          isPending={createDealMut.isPending || updateDealMut.isPending}
          onTitleChange={setDTitle} onDescriptionChange={setDDescription}
          onContactIdChange={setDContactId} onStatusChange={setDStatus}
          onValueChange={setDValue} onCurrencyChange={setDCurrency}
          onPriorityChange={setDPriority} onDueDateChange={setDDueDate}
          onClearError={(f) => setDealErrors((p) => { const n = { ...p }; delete n[f]; return n; })}
          onSave={() => { if (validateDealForm()) { editingDeal ? updateDealMut.mutate() : createDealMut.mutate(); } }}
          onClose={() => { setShowDealForm(false); setEditingDeal(null); }}
        />
      )}
    </>
  );
}
