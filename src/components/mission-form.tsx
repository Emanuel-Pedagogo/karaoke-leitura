"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function MissionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(1);
  const [minAccuracy, setMinAccuracy] = useState("");
  const [xpReward, setXpReward] = useState(50);
  const [daysActive, setDaysActive] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const activeUntil = new Date();
    activeUntil.setDate(activeUntil.getDate() + daysActive);

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetCount,
          minAccuracy: minAccuracy ? Number(minAccuracy) : null,
          xpReward,
          activeUntil: activeUntil.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar missão");
      router.push("/professor/missoes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm">
        Título
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Descrição
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Quantas leituras para concluir
        <input
          type="number"
          min={1}
          value={targetCount}
          onChange={(e) => setTargetCount(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Precisão mínima % (opcional)
        <input
          type="number"
          min={0}
          max={100}
          value={minAccuracy}
          onChange={(e) => setMinAccuracy(e.target.value)}
          placeholder="ex: 80"
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        XP de recompensa
        <input
          type="number"
          min={1}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Válida por (dias)
        <input
          type="number"
          min={1}
          value={daysActive}
          onChange={(e) => setDaysActive(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Criar missão"}
      </button>
    </form>
  );
}
