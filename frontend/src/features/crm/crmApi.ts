import { api } from "../../shared/api/instance";
import type { Contact, Deal, PipelineStats } from "../../shared/api/types";

export async function getContacts(isLead?: boolean) {
  const params = isLead !== undefined ? { is_lead: isLead } : {};
  const { data } = await api.get<Contact[]>("/crm/contacts", { params });
  return data;
}

export async function createContactApi(payload: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  is_lead?: boolean;
}) {
  const { data } = await api.post<Contact>("/crm/contacts", payload);
  return data;
}

export async function updateContactApi(
  id: number,
  payload: Partial<Pick<Contact, "name" | "email" | "phone" | "company" | "position" | "notes" | "is_lead">>,
) {
  const { data } = await api.patch<Contact>(`/crm/contacts/${id}`, payload);
  return data;
}

export async function deleteContactApi(id: number) {
  await api.delete(`/crm/contacts/${id}`);
}

export async function getDeals(status?: string) {
  const params = status ? { status } : {};
  const { data } = await api.get<Deal[]>("/crm/deals", { params });
  return data;
}

export async function createDealApi(payload: {
  title: string;
  description?: string;
  contact_id?: number;
  status?: string;
  value?: number;
  currency?: string;
  priority?: string;
  due_date?: string;
}) {
  const { data } = await api.post<Deal>("/crm/deals", payload);
  return data;
}

export async function updateDealApi(
  id: number,
  payload: Partial<
    Pick<Deal, "title" | "description" | "contact_id" | "status" | "value" | "currency" | "priority" | "due_date">
  >,
) {
  const { data } = await api.patch<Deal>(`/crm/deals/${id}`, payload);
  return data;
}

export async function deleteDealApi(id: number) {
  await api.delete(`/crm/deals/${id}`);
}

export async function getPipelineStats() {
  const { data } = await api.get<PipelineStats>("/crm/pipeline/stats");
  return data;
}
