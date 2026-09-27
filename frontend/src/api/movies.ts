import { apiClient } from "./client";
import type {
  PaginatedMovies,
  MovieDetail,
  PaginatedReviews,
  MovieReviewCreate,
  MovieReviewOut,
} from "../types/movies";

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

export async function getMovieDetail(id: string): Promise<MovieDetail> {
  const response = await apiClient.get<MovieDetail>(`/movies/${id}`);
  return response.data;
}

export async function listMovieReviews(
  id: string,
  page: number,
  pageSize: number,
): Promise<PaginatedReviews> {
  const response = await apiClient.get<PaginatedReviews>(
    `/movies/${id}/reviews`,
    { params: { page, page_size: pageSize } },
  );
  return response.data;
}

export async function createMovieReview(
  id: string,
  payload: MovieReviewCreate,
): Promise<MovieReviewOut> {
  const response = await apiClient.post<MovieReviewOut>(
    `/movies/${id}/reviews`,
    payload,
  );
  return response.data;
}