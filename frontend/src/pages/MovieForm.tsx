import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createMovie } from "../api/movies";
import { listGenres } from "../api/genres";
import type { GenreOut } from "../types/movies";
import "./MovieForm.css";

export function MovieForm() {
  const navigate = useNavigate();

  const [genres, setGenres] = useState<GenreOut[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [anoLancamento, setAnoLancamento] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [diretor, setDiretor] = useState("");
  const [urlPoster, setUrlPoster] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .finally(() => setGenresLoading(false));
  }, []);

  function toggleGenre(id: string) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  function validate(): string | null {
    if (!titulo.trim()) return "Título é obrigatório.";
    if (titulo.trim().length > 500) return "Título muito longo (máx. 500 caracteres).";

    const ano = Number(anoLancamento);
    if (anoLancamento.trim() === "" || Number.isNaN(ano))
      return "Ano de lançamento é obrigatório.";
    if (ano < 1870 || ano > 2100) return "Ano deve estar entre 1870 e 2100.";

    if (selectedGenres.length === 0) return "Selecione ao menos um gênero.";

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const movie = await createMovie({
        titulo: titulo.trim(),
        ano_lancamento: Number(anoLancamento),
        sinopse: sinopse.trim() || null,
        diretor: diretor.trim() || null,
        url_poster: urlPoster.trim() || null,
        generos: selectedGenres,
      });
      navigate(`/movies/${movie.sk_movie_id}`);
    } catch {
      setError("Não foi possível cadastrar o filme. Verifique os dados e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="movie-form-page">
      <h1>Cadastrar filme</h1>

      <form className="movie-form" onSubmit={handleSubmit}>
        <label>
          Título *
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
        </label>

        <label>
          Ano de lançamento *
          <input
            type="number"
            value={anoLancamento}
            onChange={(e) => setAnoLancamento(e.target.value)}
            min={1870}
            max={2100}
            disabled={submitting}
          />
        </label>

        <label>
          Diretor
          <input
            type="text"
            value={diretor}
            onChange={(e) => setDiretor(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label>
          URL do pôster
          <input
            type="text"
            value={urlPoster}
            onChange={(e) => setUrlPoster(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label>
          Sinopse
          <textarea
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
            rows={4}
            disabled={submitting}
          />
        </label>

        <fieldset className="genre-fieldset">
          <legend>Gêneros *</legend>
          {genresLoading && <p>Carregando gêneros...</p>}
          {!genresLoading &&
            genres.map((genre) => (
              <label key={genre.sk_genre_id} className="genre-checkbox">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.sk_genre_id)}
                  onChange={() => toggleGenre(genre.sk_genre_id)}
                  disabled={submitting}
                />
                {genre.nome_genero}
              </label>
            ))}
        </fieldset>

        {error && <p role="alert" className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Cadastrando..." : "Cadastrar filme"}
        </button>
      </form>
    </div>
  );
}