import { useEffect, useState } from "react";
import { listMovies } from "../api/movies";
import type { MovieListItem } from "../types/movies";

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

  // debounce: só atualiza `titulo` (que dispara a busca) 400ms depois de parar de digitar
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTitulo(searchInput);
      setPage(1); // toda busca nova volta pra página 1
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
    <div>
      <input
        type="text"
        placeholder="Buscar por título..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {loading && <p>Carregando...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <p>{total} filme(s) encontrado(s)</p>
          <ul>
            {items.map((movie) => (
              <li key={movie.sk_movie_id}>
                {movie.url_poster && (
                  <img src={movie.url_poster} alt={movie.titulo} width={80} />
                )}
                <strong>{movie.titulo}</strong> ({movie.ano_lancamento ?? "—"})
                <div>{movie.generos.join(", ") || "Sem gênero"}</div>
                <div>
                  {movie.nota_media != null
                    ? `${movie.nota_media.toFixed(1)}/10`
                    : "Sem avaliações"}{" "}
                  ({movie.qtd_avaliacoes})
                </div>
              </li>
            ))}
          </ul>

          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span> Página {page} de {pages} </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </button>
        </>
      )}
    </div>
  );
}