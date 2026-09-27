import { useState } from "react";

interface PosterImageProps {
  src: string | null;
  alt: string;
}

export function PosterImage({ src, alt }: PosterImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return <div className="movie-poster-placeholder">Sem imagem</div>;
  }

  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}