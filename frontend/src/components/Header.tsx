import { Link } from "react-router-dom";
import "./Header.css";

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        <span className="app-logo-mark" aria-hidden="true">C</span>
        CineRocket
      </Link>
      <nav className="header-nav" aria-label="Navegação principal">
        <a className="header-nav-link header-nav-link-active" href="#catalogo">Explorar</a>
        <a className="header-nav-link" href="#criticas">Críticas</a>
        <a className="header-nav-link" href="#ranking">Ranking</a>
      </nav>
      <div className="header-tools">
        <label className="header-search">
          <span className="sr-only">Buscar filmes</span>
          <input
            type="search"
            placeholder="Buscar filmes..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <div className="header-avatar" aria-label="Perfil">CR</div>
      </div>
    </header>
  );
}