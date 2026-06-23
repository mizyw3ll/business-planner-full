import { api } from "../../shared/api/instance";
import type { PaginatedNotes, Note, Project } from "../../shared/api/types";

export async function getProjectsApi() {
  const { data } = await api.get<Project[]>(`/notes/projects`);
  return data;
}

export async function createProjectApi(payload: { name: string; description?: string; color_idx?: number }) {
  const { data } = await api.post<Project>(`/notes/projects`, payload);
  return data;
}

export async function updateProjectApi(
  projectId: number,
  payload: { name?: string; description?: string; color_idx?: number },
) {
  const { data } = await api.patch<Project>(`/notes/projects/${projectId}`, payload);
  return data;
}

export async function deleteProjectApi(projectId: number) {
  await api.delete(`/notes/projects/${projectId}`);
}

export async function getNotesApi(params?: {
  project_id?: number;
  tag_ids?: string;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.set("project_id", String(params.project_id));
  if (params?.tag_ids) searchParams.set("tag_ids", params.tag_ids);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));
  const query = searchParams.toString();
  const { data } = await api.get<PaginatedNotes>(`/notes${query ? `?${query}` : ""}`);
  return data;
}

export async function createNoteApi(payload: {
  title: string;
  content_markdown?: string;
  project_id?: number | null;
  tag_ids?: number[];
}) {
  const { data } = await api.post<Note>(`/notes`, payload);
  return data;
}

export async function getNoteApi(noteId: number) {
  const { data } = await api.get<Note>(`/notes/${noteId}`);
  return data;
}

export async function updateNoteApi(
  noteId: number,
  payload: { title?: string; content_markdown?: string; project_id?: number | null; tag_ids?: number[] },
) {
  const { data } = await api.patch<Note>(`/notes/${noteId}`, payload);
  return data;
}

export async function deleteNoteApi(noteId: number) {
  await api.delete(`/notes/${noteId}`);
}
