import { useState, type FormEvent } from "react";
import { createMovieReview } from "../api/movies";

interface ReviewFormProps {
  movieId: string;
  onReviewAdded: () => void;
}

export function ReviewForm({ movieId, onReviewAdded }: ReviewFormProps) {
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nome.trim()) return "Nome é obrigatório.";
    if (nome.trim().length > 120) return "Nome muito longo (máx. 120 caracteres).";

    const notaNum = Number(nota);
    if (nota.trim() === "" || Number.isNaN(notaNum)) return "Nota é obrigatória.";
    if (notaNum < 0 || notaNum > 10) return "Nota deve estar entre 0 e 10.";
    if (!/^\d+(\.\d{1,2})?$/.test(nota.trim()))
      return "Nota aceita no máximo 2 casas decimais.";

    if (!comentario.trim()) return "Comentário é obrigatório.";
    if (comentario.trim().length > 4000)
      return "Comentário muito longo (máx. 4000 caracteres).";

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
      await createMovieReview(movieId, {
        nome: nome.trim(),
        nota: Number(nota),
        comentario: comentario.trim(),
      });
      setNome("");
      setNota("");
      setComentario("");
      onReviewAdded();
    } catch {
      setError("Não foi possível enviar a avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Deixe sua avaliação</h3>

      <label>
        Nome
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={120}
          disabled={submitting}
        />
      </label>

      <label>
        Nota (0 a 10)
        <input
          type="number"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          min={0}
          max={10}
          step={0.01}
          disabled={submitting}
        />
      </label>

      <label>
        Comentário
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={4000}
          rows={4}
          disabled={submitting}
        />
      </label>

      {error && <p role="alert" className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}