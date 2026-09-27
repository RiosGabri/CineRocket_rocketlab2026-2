import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createMovie, getMovieDetail, updateMovie } from "../api/movies";
import { listGenres } from "../api/genres";
import type { GenreOut } from "../types/movies";
import "./MovieForm.css";

export function MovieForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [genres, setGenres] = useState<GenreOut[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [movieLoading, setMovieLoading] = useState(isEditMode);

  const [titulo, setTitulo] = useState("");
  const [anoLancamento, setAnoLancamento] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [diretor, setDiretor] = useState("");
  const [urlPoster, setUrlPoster] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [movieGenreNames, setMovieGenreNames] = useState<string[]>([]);

  const [dataLancamento, setDataLancamento] = useState<string | null>(null);
  const [duracaoMinutos, setDuracaoMinutos] = useState<number | null>(null);
  const [statusFilme, setStatusFilme] = useState<string | null>(null);
  const [urlBackdrop, setUrlBackdrop] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .finally(() => setGenresLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    setMovieLoading(true);
    getMovieDetail(id)
      .then((movie) => {
        setTitulo(movie.titulo);
        setAnoLancamento(String(movie.ano_lancamento ?? ""));
        setSinopse(movie.sinopse ?? "");
        setDiretor(movie.diretores[0] ?? "");
        setUrlPoster(movie.url_poster ?? "");
        setMovieGenreNames(movie.generos);
        setDataLancamento(movie.data_lancamento);
        setDuracaoMinutos(movie.duracao_minutos && movie.duracao_minutos > 0 ? movie.duracao_minutos : null);
        setStatusFilme(movie.status_filme);
        setUrlBackdrop(movie.url_backdrop);
      })
      .catch(() => setError("Não foi possível carregar o filme para edição."))
      .finally(() => setMovieLoading(false));
  }, [id]);

  useEffect(() => {
    if (movieGenreNames.length === 0 || genres.length === 0) return;
    const ids = genres
      .filter((g) => movieGenreNames.includes(g.nome_genero))
      .map((g) => g.sk_genre_id);
    setSelectedGenres(ids);
  }, [movieGenreNames, genres]);

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId],
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
      const payload = {
        titulo: titulo.trim(),
        ano_lancamento: Number(anoLancamento),
        sinopse: sinopse.trim() || null,
        diretor: diretor.trim() || null,
        url_poster: urlPoster.trim() || null,
        generos: selectedGenres,
        data_lancamento: dataLancamento,
        duracao_minutos: duracaoMinutos,
        status_filme: statusFilme,
        url_backdrop: urlBackdrop,
      };

      const movie = isEditMode
        ? await updateMovie(id!, payload)
        : await createMovie(payload);

      navigate(`/movies/${movie.sk_movie_id}`);
    } catch {
      setError(
        isEditMode
          ? "Não foi possível salvar as alterações. Verifique os dados e tente novamente."
          : "Não foi possível cadastrar o filme. Verifique os dados e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (movieLoading) return <p className="movie-form-page">Carregando...</p>;

  return (
    <div className="movie-form-page">
      <Link to={isEditMode ? `/movies/${id}` : "/"} className="back-link">
        ← {isEditMode ? "Voltar ao filme" : "Voltar ao catálogo"}
      </Link>

      <h1>{isEditMode ? "Editar filme" : "Cadastrar filme"}</h1>

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
          {submitting
            ? "Salvando..."
            : isEditMode
              ? "Salvar alterações"
              : "Cadastrar filme"}
        </button>
      </form>
    </div>
  );
}