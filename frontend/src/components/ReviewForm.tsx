import { useState, type FormEvent } from "react";
import { createMovieReview, updateMovieReview } from "../api/movies";
import type { MovieReviewOut } from "../types/movies";

interface ReviewFormProps {
  movieId: string;
  review?: MovieReviewOut; // se vier, o formulário está em modo edição
  onSaved: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ movieId, review, onSaved, onCancel }: ReviewFormProps) {
  const isEditMode = review !== undefined;

  const [nome, setNome] = useState(review?.nome ?? "");
  // arredonda para 2 casas: o formulário só aceita até 2 casas decimais
  const [nota, setNota] = useState(
    review ? String(Math.round(review.nota * 100) / 100) : "",
  );
  const [comentario, setComentario] = useState(review?.comentario ?? "");
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
      const payload = {
        nome: nome.trim(),
        nota: Number(nota),
        comentario: comentario.trim(),
      };

      if (review) {
        await updateMovieReview(movieId, review.sk_movie_review_id, payload);
      } else {
        await createMovieReview(movieId, payload);
        setNome("");
        setNota("");
        setComentario("");
      }
      onSaved();
    } catch {
      setError(
        isEditMode
          ? "Não foi possível salvar a avaliação. Tente novamente."
          : "Não foi possível enviar a avaliação. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>{isEditMode ? "Editar avaliação" : "Deixe sua avaliação"}</h3>

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

      <div className="review-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Salvando..."
            : isEditMode
              ? "Salvar alterações"
              : "Enviar avaliação"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="review-cancel-button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}