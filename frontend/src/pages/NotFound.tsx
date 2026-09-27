import { Link } from "react-router-dom";
import "./NotFound.css";

export function NotFound() {
  return (
    <div className="not-found-page">
      <h1>Página não encontrada</h1>
      <p>O endereço que você acessou não existe.</p>
      <Link to="/">Voltar ao catálogo</Link>
    </div>
  );
}