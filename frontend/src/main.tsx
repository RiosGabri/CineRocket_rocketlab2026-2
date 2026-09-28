import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { MoviesList } from "./pages/MoviesList";
import { MovieDetail } from "./pages/MovieDetail";
import { MovieForm } from "./pages/MovieForm";
import { NotFound } from "./pages/NotFound";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<MoviesList />} />
        <Route path="/movies/new" element={<MovieForm />} />
        <Route path="/movies/:id/edit" element={<MovieForm />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
