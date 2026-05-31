"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  title: string;
  targetWeeklyReadings: number;
  minAccuracyPct: number | null;
  minWcpm: number | null;
};

type Props = {
  classId: string;
  initial?: Initial;
};

export function ClassGoalForm({ classId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "Meta da turma");
  const [targetWeeklyReadings, setTargetWeeklyReadings] = useState(
    initial?.targetWeeklyReadings ?? 2,
  );
  const [minAccuracyPct, setMinAccuracyPct] = useState(
    initial?.minAccuracyPct?.toString() ?? "80",
  );
  const [minWcpm, setMinWcpm] = useState(
    initial?.minWcpm?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/class-goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title: title.trim(),
          targetWeeklyReadings,
          minAccuracyPct: minAccuracyPct ? Number(minAccuracyPct) : null,
          minWcpm: minWcpm ? Number(minWcpm) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm">
        Nome da meta
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Leituras por aluno / semana
        <input
          type="number"
          min={1}
          value={targetWeeklyReadings}
          onChange={(e) => setTargetWeeklyReadings(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Precisão mínima % (alerta)
        <input
          type="number"
          min={0}
          max={100}
          value={minAccuracyPct}
          onChange={(e) => setMinAccuracyPct(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        WCPM mínimo (opcional, alertas futuros)
        <input
          type="number"
          min={0}
          value={minWcpm}
          onChange={(e) => setMinWcpm(e.target.value)}
          placeholder="ex: 40"
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar meta"}
      </button>
    </form>
  );
}
