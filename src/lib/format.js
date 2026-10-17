export function initials(name) {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TITLES = /^(dr|dra|sr|sra|prof|profa)\.?$/i;

// Primeiro nome, ignorando títulos como "Dr." / "Dra.".
export function firstName(name) {
  if (!name) {
    return '';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const meaningful = parts.filter((part) => !TITLES.test(part));
  return meaningful[0] ?? parts[0] ?? '';
}
