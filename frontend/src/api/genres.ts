import { apiClient } from "./client";
import type { GenreOut } from "../types/movies";

export async function listGenres(): Promise<GenreOut[]> {
  const response = await apiClient.get<GenreOut[]>("/genres");
  return response.data;
}