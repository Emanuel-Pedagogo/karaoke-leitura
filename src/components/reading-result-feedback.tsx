"use client";

type Props = {
  unlockedAchievements: Array<{
    title: string;
    icon: string;
    description: string;
  }>;
  missionsCompleted: Array<{
    title: string;
    xpReward: number;
  }>;
  leveledUp: boolean;
  newLevel?: number;
  comboStreak: number;
};

export function ReadingResultFeedback({
  unlockedAchievements,
  missionsCompleted,
  leveledUp,
  newLevel,
  comboStreak,
}: Props) {
  const hasExtras =
    unlockedAchievements.length > 0 ||
    missionsCompleted.length > 0 ||
    leveledUp ||
    comboStreak >= 2;

  if (!hasExtras) return null;

  return (
    <div className="space-y-3 text-left text-sm">
      {comboStreak >= 2 && (
        <p className="rounded-lg bg-accent/15 border border-accent/30 px-4 py-2 font-medium">
          🔥 Combo {comboStreak}x — continue assim!
        </p>
      )}
      {leveledUp && newLevel && (
        <p className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-2 font-medium text-primary">
          ⬆️ Subiu para o nível {newLevel}!
        </p>
      )}
      {missionsCompleted.map((m) => (
        <p
          key={m.title}
          className="rounded-lg bg-success/10 border border-success/30 px-4 py-2"
        >
          ✅ Missão concluída: <strong>{m.title}</strong> (+{m.xpReward} XP)
        </p>
      ))}
      {unlockedAchievements.map((a) => (
        <p
          key={a.title}
          className="rounded-lg bg-card border border-foreground/10 px-4 py-2"
        >
          {a.icon} Nova conquista: <strong>{a.title}</strong> — {a.description}
        </p>
      ))}
    </div>
  );
}
