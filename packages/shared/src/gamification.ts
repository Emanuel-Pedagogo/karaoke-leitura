/** Multiplicador de pontuação conforme sequência de leituras precisas (≥90%). */
export function comboMultiplierFromStreak(streak: number): number {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.25;
  if (streak >= 2) return 1.15;
  if (streak >= 1) return 1.05;
  return 1;
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
