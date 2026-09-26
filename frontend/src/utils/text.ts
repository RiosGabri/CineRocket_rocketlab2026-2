export function normalizeTitle(titulo: string): string {
  return titulo.replace(/"{2,}/g, '"');
}