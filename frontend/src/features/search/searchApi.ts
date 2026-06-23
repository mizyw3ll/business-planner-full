import { api } from "../../shared/api/instance";
import type { SearchResults } from "../../shared/api/types";

export async function searchApi(query: string) {
  const { data } = await api.get<SearchResults>("/search", { params: { q: query } });
  return data;
}
