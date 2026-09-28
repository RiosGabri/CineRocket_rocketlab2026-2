import { startTransition, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMovieCatalogStats,
  getMovieDetail,
  listMovieReviews,
  listMovies,
} from "../api/movies";
import type {
  MovieCatalogStats,
  MovieDetail,
  MovieListItem,
  MovieReviewOut,
} from "../types/movies";
import { normalizeTitle } from "../utils/text";
import { translateGenre } from "../constants/genreLabels";
import { PosterImage } from "../components/PosterImage";
import "./MoviesList.css";

const PAGE_SIZE = 6;

interface MoviesListProps {
  searchValue: string;
}

export function MoviesList({ searchValue }: MoviesListProps) {
  const [items, setItems] = useState<MovieListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [selectedMovie, setSelectedMovie] = useState<MovieListItem | null>(null);
  const [movieDetail, setMovieDetail] = useState<MovieDetail | null>(null);
  const [catalogStats, setCatalogStats] = useState<MovieCatalogStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<
    (MovieReviewOut & { movieTitle: string; movieId: string })[]
  >([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTitulo(searchValue);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    listMovies(page, PAGE_SIZE, titulo || undefined)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setError("Não foi possível carregar os filmes."))
      .finally(() => setLoading(false));
  }, [page, titulo]);

  useEffect(() => {
    getMovieCatalogStats().then(setCatalogStats).catch(() => setCatalogStats(null));
  }, []);

  useEffect(() => {
    const visibleItems =
      activeGenre === "Todos"
        ? items
        : items.filter((movie) => movie.generos.includes(activeGenre));
    const candidates = visibleItems
      .filter((movie) => movie.qtd_avaliacoes > 0)
      .slice(0, PAGE_SIZE);

    let current = true;
    Promise.all(
      candidates.map(async (movie) => {
        try {
          const result = await listMovieReviews(movie.sk_movie_id, 1, 10);
          return { movie, reviews: result.items };
        } catch {
          return { movie, reviews: [] as MovieReviewOut[] };
        }
      }),
    ).then((reviewGroups) => {
      if (!current) return;
      const reviews = reviewGroups.flatMap(({ movie, reviews: movieReviews }) =>
        movieReviews.map((review) => ({
          ...review,
          movieTitle: normalizeTitle(movie.titulo),
          movieId: movie.sk_movie_id,
        })),
      );
      setRecentReviews(
        reviews
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          .slice(0, 3),
      );
    });
    return () => {
      current = false;
    };
  }, [items, activeGenre]);

  useEffect(() => {
    if (!selectedMovie) return;

    let current = true;
    getMovieDetail(selectedMovie.sk_movie_id)
      .then((detail) => {
        if (current) setMovieDetail(detail);
      })
      .catch(() => {
        if (current) setMovieDetail(null);
      });

    return () => {
      current = false;
    };
  }, [selectedMovie]);

  useEffect(() => {
    if (!selectedMovie) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedMovie(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedMovie]);

  const genres = ["Todos", ...new Set(items.flatMap((movie) => movie.generos))];
  const filteredItems =
    activeGenre === "Todos"
      ? items
      : items.filter((movie) => movie.generos.includes(activeGenre));
  const favoriteGenres = catalogStats?.generos_populares ?? [];
  const maxGenreCount = Math.max(
    1,
    ...favoriteGenres.map(({ qtd_filmes }) => qtd_filmes),
  );
  const featuredMovie = items.find((movie) => movie.url_poster) ?? items[0];
  const visibleMovieDetail =
    selectedMovie && movieDetail?.sk_movie_id === selectedMovie.sk_movie_id
      ? movieDetail
      : null;

  return (
    <div className="movies-page">
      <section className="movies-hero" aria-label="Filme em destaque">
        {featuredMovie?.url_poster && (
          <img
            className="hero-image"
            src={featuredMovie.url_poster}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="hero-copy">
          <span className="eyebrow"><span /> SEU PRÓXIMO FILME FAVORITO</span>
          <h1>Histórias que<br />ficam com você.</h1>
          <p>Descubra filmes, encontre novas perspectivas e compartilhe o que te emocionou.</p>
          {featuredMovie && (
            <button
              type="button"
              className="primary-button hero-button"
              onClick={() => setSelectedMovie(featuredMovie)}
            >
              Filme em destaque <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
        {featuredMovie && (
          <div className="hero-caption">
            <span>EM DESTAQUE</span>
            <strong>{normalizeTitle(featuredMovie.titulo)}</strong>
            <span>{featuredMovie.ano_lancamento ?? "Ano não informado"}</span>
          </div>
        )}
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURADORIA CINE ROCKET</span>
            <h2>Explore o catálogo</h2>
          </div>
          <span className="catalog-total">{total} filmes</span>
        </div>

        <div className="genre-filters" aria-label="Filtrar por gênero">
          {genres.map((genre) => (
            <button
              type="button"
              key={genre}
              className={`genre-pill${activeGenre === genre ? " is-active" : ""}`}
              aria-pressed={activeGenre === genre}
              onClick={() => setActiveGenre(genre)}
            >
              {genre === "Todos" ? genre : translateGenre(genre)}
            </button>
          ))}
        </div>

        {loading && <p className="catalog-message">Carregando filmes...</p>}
        {error && <p className="catalog-message" role="alert">{error}</p>}

        {!loading && !error && (
          <div className="catalog-layout">
            <div className="catalog-main-column">
              <div className="movies-grid">
                {filteredItems.map((movie, index) => (
                  <button
                    type="button"
                    className="movie-card"
                    key={movie.sk_movie_id}
                    onClick={() => setSelectedMovie(movie)}
                    aria-label={`Ver detalhes de ${normalizeTitle(movie.titulo)}`}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div className="movie-poster">
                      <PosterImage src={movie.url_poster} alt={movie.titulo} />
                      <div className="poster-overlay">
                        <span className="poster-badge">Ver filme <span aria-hidden="true">↗</span></span>
                      </div>
                    </div>
                    <div className="movie-info">
                      <div className="movie-card-title-row">
                        <h3>{normalizeTitle(movie.titulo)}</h3>
                        <span className="movie-card-year">{movie.ano_lancamento ?? "—"}</span>
                      </div>
                      <div className="movie-genres">
                        {movie.generos.length > 0
                          ? movie.generos.slice(0, 2).map(translateGenre).join(" · ")
                          : "Sem gênero"}
                      </div>
                      <div className="movie-rating">
                        <span aria-hidden="true">★</span>
                        {movie.nota_media != null ? movie.nota_media.toFixed(1) : "—"}
                        <span className="movie-rating-count">({movie.qtd_avaliacoes})</span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="catalog-message">Nenhum filme encontrado neste gênero.</p>
                )}
              </div>

              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Anterior
                </button>
                <span>Página {page} de {Math.max(1, pages)}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </div>

              <section className="reviews-section" id="criticas">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">VOZES DA COMUNIDADE</span>
                    <h2>Críticas da página</h2>
                  </div>
                </div>
                {recentReviews.length > 0 ? (
                  <div className="reviews-list">
                    {recentReviews.map((review) => (
                      <article className="review-quote" key={review.sk_movie_review_id}>
                        <p>“{review.comentario}”</p>
                        <div className="review-attribution">
                          <strong>{review.nome}</strong>
                          <span>{review.movieTitle}</span>
                          <span className="review-score">★ {review.nota.toFixed(1)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-reviews">Nenhuma crítica nos filmes desta página.</p>
                )}
              </section>
            </div>

            <aside className="catalog-sidebar">
              <section className="sidebar-panel" id="ranking">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">ÚLTIMOS 7 DIAS</span>
                    <h2>Ranking semanal</h2>
                  </div>
                  <span className="panel-icon" aria-hidden="true">↗</span>
                </div>
                <ol className="ranking-list">
                  {catalogStats?.ranking_semanal.map((movie, index) => (
                    <li key={movie.sk_movie_id}>
                      <span className="ranking-position">0{index + 1}</span>
                      <div className="ranking-copy">
                        <strong>{normalizeTitle(movie.titulo)}</strong>
                        <span>{movie.qtd_avaliacoes_semana} {movie.qtd_avaliacoes_semana === 1 ? "crítica" : "críticas"} nesta semana</span>
                      </div>
                      <span className="ranking-score">★ {movie.nota_media_semana.toFixed(1)}</span>
                    </li>
                  ))}
                  {catalogStats && catalogStats.ranking_semanal.length === 0 && <li className="sidebar-empty">Sem novas avaliações nos últimos 7 dias.</li>}
                  {!catalogStats && <li className="sidebar-empty">Carregando ranking...</li>}
                </ol>
                <p className="ranking-note">Ordenado por volume de críticas; nota média como desempate.</p>
              </section>

              <section className="sidebar-panel stats-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">SEU UNIVERSO</span>
                    <h2>Visão geral</h2>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-cell">
                    <strong>{catalogStats?.total_filmes ?? "—"}</strong>
                    <span>filmes no catálogo</span>
                  </div>
                  <div className="stat-cell">
                    <strong>{catalogStats?.filmes_avaliados ?? "—"}</strong>
                    <span>filmes avaliados</span>
                  </div>
                  <div className="stat-cell">
                    <strong>{catalogStats?.nota_media?.toFixed(1) ?? "—"}</strong>
                    <span>média das notas</span>
                  </div>
                  <div className="stat-cell">
                    <strong>{catalogStats?.total_generos ?? "—"}</strong>
                    <span>gêneros cadastrados</span>
                  </div>
                </div>
              </section>

              <section className="sidebar-panel genres-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">O QUE ASSISTIMOS</span>
                    <h2>Gêneros populares</h2>
                  </div>
                </div>
                <div className="genre-bars">
                  {favoriteGenres.map(({ nome_genero, qtd_filmes }) => (
                    <div className="genre-bar-row" key={nome_genero}>
                      <div className="genre-bar-label">
                        <span>{translateGenre(nome_genero)}</span>
                        <span>{qtd_filmes}</span>
                      </div>
                      <div className="genre-bar-track">
                        <span style={{ width: `${(qtd_filmes / maxGenreCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {catalogStats && favoriteGenres.length === 0 && <p className="sidebar-empty">Gêneros aparecerão com os filmes.</p>}
                  {!catalogStats && <p className="sidebar-empty">Carregando gêneros...</p>}
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <Link to="/" className="footer-brand">CineRocket</Link>
        <span>Feito para quem ama boas histórias.</span>
      </footer>

      {selectedMovie && (
        <div
          className="movie-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMovie(null);
          }}
        >
          <section
            className="movie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movie-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fechar detalhes"
              onClick={() => setSelectedMovie(null)}
            >×</button>
            <div className="modal-poster">
              <PosterImage src={selectedMovie.url_poster} alt={selectedMovie.titulo} />
            </div>
            <div className="modal-content">
              <span className="eyebrow">{visibleMovieDetail?.ano_lancamento ?? selectedMovie.ano_lancamento ?? "FILME"}</span>
              <h2 id="movie-modal-title">{normalizeTitle(selectedMovie.titulo)}</h2>
              <p className="modal-genres">
                {(visibleMovieDetail?.generos ?? selectedMovie.generos).map(translateGenre).join(" · ") || "Sem gênero"}
              </p>
              <div className="modal-rating">
                <span>★</span>
                {selectedMovie.nota_media?.toFixed(1) ?? "—"}
                <small>{selectedMovie.qtd_avaliacoes} avaliações</small>
              </div>
              <p className="modal-synopsis">
                {visibleMovieDetail
                  ? visibleMovieDetail.sinopse || "Sinopse não disponível para este filme."
                  : "Carregando detalhes do filme..."}
              </p>
              {visibleMovieDetail?.diretores.length ? (
                <p className="modal-director">Direção: {visibleMovieDetail.diretores.join(", ")}</p>
              ) : null}
              <Link
                className="primary-button modal-details-link"
                to={`/movies/${selectedMovie.sk_movie_id}`}
              >
                Abrir página completa <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}