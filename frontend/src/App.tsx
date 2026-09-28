import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { MovieDetail } from "./pages/MovieDetail";
import { MovieForm } from "./pages/MovieForm";
import { MoviesList } from "./pages/MoviesList";
import { NotFound } from "./pages/NotFound";

export function App() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <BrowserRouter>
      <Header searchValue={searchValue} onSearchChange={setSearchValue} />
      <Routes>
        <Route path="/" element={<MoviesList searchValue={searchValue} />} />
        <Route path="/movies/new" element={<MovieForm />} />
        <Route path="/movies/:id/edit" element={<MovieForm />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}