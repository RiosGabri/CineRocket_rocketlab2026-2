import { apiClient } from "./client";
import type { PaginatedMovies } from "../types/movies";

export async function listMovies(
  page: number,
  pageSize: number,
  titulo?: string,
): Promise<PaginatedMovies> {
  const response = await apiClient.get<PaginatedMovies>("/movies", {
    params: { page, page_size: pageSize, ...(titulo ? { titulo } : {}) },
  });
  return response.data;
}