import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMovies } from "../api/movies";
import type { MovieListItem } from "../types/movies";
import { normalizeTitle } from "../utils/text";
import { translateGenre } from "../constants/genreLabels";
import { PosterImage } from "../components/PosterImage";
import "./MoviesList.css";

const PAGE_SIZE = 20;

export function MoviesList() {
  const [items, setItems] = useState<MovieListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTitulo(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listMovies(page, PAGE_SIZE, titulo || undefined)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setError("Não foi possível carregar os filmes."))
      .finally(() => setLoading(false));
  }, [page, titulo]);

  return (
    <div className="movies-page">
      <Link to="/movies/new" className="new-movie-link">
        + Cadastrar filme
      </Link>

      <input
        type="text"
        className="search-input"
        placeholder="Buscar por título..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {loading && <p>Carregando...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <p className="results-count">{total} filme(s) encontrado(s)</p>

          <div className="movies-grid">
            {items.map((movie) => (
              <Link
                to={`/movies/${movie.sk_movie_id}`}
                className="movie-card"
                key={movie.sk_movie_id}
              >
                <div className="movie-poster">
                  <PosterImage src={movie.url_poster} alt={movie.titulo} />
                </div>
                <div className="movie-info">
                  <h3>{normalizeTitle(movie.titulo)}</h3>
                  <span className="movie-year">{movie.ano_lancamento ?? "—"}</span>
                  <div className="movie-genres">
                    {movie.generos.length > 0
                      ? movie.generos.map(translateGenre).join(", ")
                      : "Sem gênero"}
                  </div>
                  <div className="movie-rating">
                    {movie.nota_media != null
                      ? `${movie.nota_media.toFixed(1)}/10`
                      : "Sem avaliações"}{" "}
                    <span className="movie-rating-count">
                      ({movie.qtd_avaliacoes})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              {" "}
              Página {page} de {pages}{" "}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}