// Hover "hot/cold" aura ring classes shared by the pantry cards and the
// recipe slots: green = pairs well, red = clashes. Direction only — exact
// values stay journal/Affinity Lens territory.
export function affinityRing(affinity: number): string {
  if (affinity > 0.5) return "ring-4 ring-tier-good";
  if (affinity > 0) return "ring-2 ring-tier-good/60";
  if (affinity < -0.3) return "ring-4 ring-tier-terrible";
  return "ring-2 ring-ink/15";
}
