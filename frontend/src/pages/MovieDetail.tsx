import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovieDetail, listMovieReviews } from "../api/movies";
import type { MovieDetail as MovieDetailType, MovieReviewOut } from "../types/movies";
import { normalizeTitle } from "../utils/text";
import { translateGenre } from "../constants/genreLabels";
import { ExpandableList } from "../components/ExpandableList";
import { ReviewForm } from "../components/ReviewForm";
import "./MovieDetail.css";

const REVIEWS_PAGE_SIZE = 10;

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<MovieDetailType | null>(null);
  const [movieLoading, setMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<MovieReviewOut[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setMovieLoading(true);
    setMovieError(null);
    getMovieDetail(id)
      .then(setMovie)
      .catch(() => setMovieError("Filme não encontrado."))
      .finally(() => setMovieLoading(false));
  }, [id]);

  function fetchReviews(movieId: string, targetPage: number) {
    setReviewsLoading(true);
    listMovieReviews(movieId, targetPage, REVIEWS_PAGE_SIZE)
      .then((data) => {
        setReviews(data.items);
        setReviewsPages(data.pages);
      })
      .finally(() => setReviewsLoading(false));
  }

  useEffect(() => {
    if (!id) return;
    fetchReviews(id, reviewsPage);
  }, [id, reviewsPage]);

  function handleReviewAdded() {
    if (!id) return;
    setReviewsPage(1); // review nova aparece primeiro (created_at desc)
    fetchReviews(id, 1);
    getMovieDetail(id).then(setMovie); // atualiza nota_media_usuarios/qtd
  }

  if (movieLoading) return <p className="detail-status">Carregando...</p>;
  if (movieError || !movie)
    return (
      <div className="detail-status">
        <p role="alert">{movieError ?? "Filme não encontrado."}</p>
        <Link to="/">Voltar ao catálogo</Link>
      </div>
    );

  return (
    <div className="movie-detail">
      <Link to="/" className="back-link">
        ← Voltar ao catálogo
      </Link>

      <div className="detail-header">
        <div className="detail-poster">
          {movie.url_poster ? (
            <img src={movie.url_poster} alt={movie.titulo} />
          ) : (
            <div className="movie-poster-placeholder">Sem imagem</div>
          )}
        </div>

        <div className="detail-info">
          <h1>{normalizeTitle(movie.titulo)}</h1>
          <p className="detail-meta">
            {movie.ano_lancamento ?? "—"}
            {movie.duracao_minutos ? ` · ${movie.duracao_minutos} min` : ""}
            {movie.status_filme ? ` · ${movie.status_filme}` : ""}
          </p>

          <p className="detail-genres">
            {movie.generos.length > 0
              ? movie.generos.map(translateGenre).join(", ")
              : "Sem gênero"}
          </p>

          <div className="detail-rating">
            {movie.nota_media_usuarios != null
              ? `${movie.nota_media_usuarios.toFixed(1)}/10`
              : "Sem avaliações"}{" "}
            <span className="movie-rating-count">
              ({movie.qtd_avaliacoes_usuarios}{" "}
              {movie.qtd_avaliacoes_usuarios === 1 ? "avaliação" : "avaliações"})
            </span>
          </div>

          {movie.outras_notas && (
            <p className="detail-other-ratings">
              {movie.outras_notas.nota_tmdb != null &&
                `TMDB: ${movie.outras_notas.nota_tmdb.toFixed(1)} `}
              {movie.outras_notas.nota_imdb != null &&
                `· IMDB: ${movie.outras_notas.nota_imdb.toFixed(1)}`}
            </p>
          )}

          {movie.sinopse && <p className="detail-synopsis">{movie.sinopse}</p>}

          <ExpandableList label="Direção" items={movie.diretores} />
          <ExpandableList label="Roteiro" items={movie.roteiristas} />
          <ExpandableList label="Elenco" items={movie.elenco} />
          <ExpandableList label="Produtoras" items={movie.produtoras} />
        </div>
      </div>

      <div className="detail-reviews">
        <h2>Avaliações</h2>

        <ReviewForm movieId={id!} onReviewAdded={handleReviewAdded} />

        {reviewsLoading && <p>Carregando avaliações...</p>}

        {!reviewsLoading && reviews.length === 0 && (
          <p>Nenhuma avaliação ainda.</p>
        )}

        {!reviewsLoading &&
          reviews.map((review) => (
            <div className="review-card" key={review.sk_movie_review_id}>
              <div className="review-header">
                <strong>{review.nome}</strong>
                <span className="review-rating">{review.nota.toFixed(1)}/10</span>
              </div>
              <p className="review-comment">{review.comentario}</p>
              <span className="review-date">
                {new Date(review.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}

        {reviewsPages > 1 && (
          <div className="pagination">
            <button
              disabled={reviewsPage <= 1}
              onClick={() => setReviewsPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span>
              {" "}
              Página {reviewsPage} de {reviewsPages}{" "}
            </span>
            <button
              disabled={reviewsPage >= reviewsPages}
              onClick={() => setReviewsPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}