import { api } from "../../shared/api/instance";
import type { Board, BoardColumn, BoardCard, BoardListItem } from "../../shared/api/types";

export async function getBoardsApi() {
  const { data } = await api.get<BoardListItem[]>("/kanban/boards");
  return data;
}

export async function getBoardApi(id: number) {
  const { data } = await api.get<Board>(`/kanban/boards/${id}`);
  return data;
}

export async function createBoardApi(payload: { title: string; business_plan_id?: number }) {
  const { data } = await api.post<Board>("/kanban/boards", payload);
  return data;
}

export async function updateBoardApi(id: number, payload: { title?: string }) {
  const { data } = await api.patch<Board>(`/kanban/boards/${id}`, payload);
  return data;
}

export async function deleteBoardApi(id: number) {
  await api.delete(`/kanban/boards/${id}`);
}

export async function createColumnApi(boardId: number, payload: { title: string; color?: string }) {
  const { data } = await api.post<BoardColumn>(`/kanban/boards/${boardId}/columns`, payload);
  return data;
}

export async function updateColumnApi(id: number, payload: { title?: string; color?: string }) {
  const { data } = await api.patch<BoardColumn>(`/kanban/columns/${id}`, payload);
  return data;
}

export async function deleteColumnApi(id: number) {
  await api.delete(`/kanban/columns/${id}`);
}

export async function reorderColumnsApi(boardId: number, columnIds: number[]) {
  await api.patch(`/kanban/boards/${boardId}/columns/reorder`, { column_ids: columnIds });
}

export async function createCardApi(columnId: number, payload: { title: string; description?: string }) {
  const { data } = await api.post<BoardCard>(`/kanban/columns/${columnId}/cards`, payload);
  return data;
}

export async function updateCardApi(id: number, payload: { title?: string; description?: string }) {
  const { data } = await api.patch<BoardCard>(`/kanban/cards/${id}`, payload);
  return data;
}

export async function deleteCardApi(id: number) {
  await api.delete(`/kanban/cards/${id}`);
}

export async function moveCardApi(id: number, payload: { column_id: number; card_order: number }) {
  const { data } = await api.patch<BoardCard>(`/kanban/cards/${id}/move`, payload);
  return data;
}
