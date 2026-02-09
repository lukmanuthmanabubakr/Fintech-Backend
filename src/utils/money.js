export function nairaToKobo(value) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) return null;

  const kobo = Math.round(n * 100);

  if (!Number.isInteger(kobo) || kobo <= 0) return null;

  return kobo;
}

export function koboToNaira(kobo) {
  const n = Number(kobo);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}
