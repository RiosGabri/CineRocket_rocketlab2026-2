import { Link } from "react-router-dom";
import "./Header.css";

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        🚀 CineRocket
      </Link>
      <Link to="/movies/new" className="header-cta">
        + Cadastrar filme
      </Link>
    </header>
  );
}