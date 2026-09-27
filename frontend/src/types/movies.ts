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

export interface OutrasNotas {
  nota_tmdb: number | null;
  qtd_tmdb: number | null;
  nota_imdb: number | null;
  qtd_imdb: number | null;
  popularidade: number | null;
  orcamento_usd: string | null;
  receita_usd: string | null;
}

export interface MovieDetail {
  sk_movie_id: string;
  id_filme: string;
  titulo: string;
  data_lancamento: string | null;
  ano_lancamento: number | null;
  duracao_minutos: number | null;
  status_filme: string | null;
  sinopse: string | null;
  url_poster: string | null;
  url_backdrop: string | null;
  generos: string[];
  produtoras: string[];
  diretores: string[];
  roteiristas: string[];
  elenco: string[];
  nota_media_usuarios: number | null;
  qtd_avaliacoes_usuarios: number;
  outras_notas: OutrasNotas | null;
}

export interface MovieReviewOut {
  sk_movie_review_id: string;
  nome: string;
  nota: number;
  comentario: string;
  created_at: string;
}

export interface PaginatedReviews {
  items: MovieReviewOut[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface MovieReviewCreate {
  nome: string;
  nota: number;
  comentario: string;
}