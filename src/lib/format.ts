// Suffix notation that feels natural for a clicker game.
// ponytail: table stops at T — game totals cap ~1e12, far under Number.MAX_SAFE_INTEGER.
const SUFFIXES = ["", "K", "M", "B", "T"];

export function formatCurry(value: number, decimals = 2): string {
  if (value < 1000) return Math.floor(value).toString();
  const index = Math.min(Math.floor(Math.log10(value) / 3), SUFFIXES.length - 1);
  const display = (value / 10 ** (index * 3)).toFixed(decimals);
  return `${display}${SUFFIXES[index]}`;
}

// Score display: always at least 4 significant figures (1.234K / 12.34K / 123.4K).
export function formatScore(value: number): string {
  if (value < 1000) return Math.floor(value).toString(); // exact integer = full precision
  const intDigits = (Math.floor(Math.log10(value)) % 3) + 1; // 1–3 mantissa digits
  return formatCurry(value, 4 - intDigits);
}
