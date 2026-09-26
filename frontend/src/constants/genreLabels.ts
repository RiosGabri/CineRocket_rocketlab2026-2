export const GENRE_LABELS: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  Animation: "Animação",
  Comedy: "Comédia",
  Crime: "Crime",
  Documentary: "Documentário",
  Drama: "Drama",
  Family: "Família",
  Fantasy: "Fantasia",
  History: "História",
  Horror: "Terror",
  Music: "Música",
  Mystery: "Mistério",
  Romance: "Romance",
  "Science Fiction": "Ficção Científica",
  "TV Movie": "Filme para TV",
  Thriller: "Suspense",
  War: "Guerra",
  Western: "Faroeste",
};

export function translateGenre(nome: string): string {
  return GENRE_LABELS[nome] ?? nome; 
}