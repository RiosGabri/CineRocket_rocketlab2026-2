export interface MovieListItem {
  sk_movie_id: string;
  titulo: string;
  ano_lancamento: number | null;
  url_poster: string | null;
  generos: string[];
  nota_media: number | null;
  qtd_avaliacoes: number;
}

export interface PaginatedMovies {
  items: MovieListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}