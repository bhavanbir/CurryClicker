import { Decimal } from "./decimal";

// Suffix notation that feels natural for a clicker game.
const SUFFIXES = [
  "", // < 1,000
  "K", // thousand
  "M", // million
  "B", // billion
  "T", // trillion
  "Qa", // quadrillion
  "Qi", // quintillion
  "Sx", // sextillion
  "Sp", // septillion
  "Oc", // octillion
  "No", // nonillion
  "Dc", // decillion
];

export function formatCurry(value: Decimal, decimals = 2): string {
  if (value.lt(1000)) return value.floor().toString();

  const index = Math.min(
    Math.floor(value.log10() / 3),
    SUFFIXES.length - 1,
  );

  // Beyond the suffix table — fall back to scientific notation.
  if (Math.floor(value.log10() / 3) >= SUFFIXES.length) {
    return value.toExponential(2);
  }

  const divisor = new Decimal(10).pow(index * 3);
  const display = value.div(divisor).toFixed(decimals);
  return `${display}${SUFFIXES[index]}`;
}

// Score display: one decimal place.
export function formatScore(value: Decimal): string {
  return formatCurry(value, 1);
}
