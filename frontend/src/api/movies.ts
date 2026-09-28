import { apiClient } from "./client";
import type {
  PaginatedMovies,
  MovieDetail,
  PaginatedReviews,
  MovieReviewCreate,
  MovieReviewOut,
  MovieCreate,
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

export async function updateMovieReview(
  movieId: string,
  reviewId: string,
  payload: MovieReviewCreate,
): Promise<MovieReviewOut> {
  const response = await apiClient.put<MovieReviewOut>(
    `/movies/${movieId}/reviews/${reviewId}`,
    payload,
  );
  return response.data;
}

export async function deleteMovieReview(
  movieId: string,
  reviewId: string,
): Promise<void> {
  await apiClient.delete(`/movies/${movieId}/reviews/${reviewId}`);
}

export async function createMovie(payload: MovieCreate): Promise<MovieDetail> {
  const response = await apiClient.post<MovieDetail>("/movies", payload);
  return response.data;
}

export async function updateMovie(
  id: string,
  payload: MovieCreate,
): Promise<MovieDetail> {
  const response = await apiClient.put<MovieDetail>(`/movies/${id}`, payload);
  return response.data;
}

export async function deleteMovie(id: string): Promise<void> {
  await apiClient.delete(`/movies/${id}`);
}