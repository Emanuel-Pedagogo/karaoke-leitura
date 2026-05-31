"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TextDifficulty } from "@prisma/client";
import { DIFFICULTY_LABELS } from "@/lib/utils";

type TextFormData = {
  title: string;
  content: string;
  difficulty: TextDifficulty;
  gradeHint: string;
};

type Props = {
  initial?: TextFormData & { id: string };
};

const difficulties: TextDifficulty[] = [
  "INICIANTE",
  "INTERMEDIARIO",
  "AVANCADO",
];

export function TextForm({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [difficulty, setDifficulty] = useState<TextDifficulty>(
    initial?.difficulty ?? "INICIANTE",
  );
  const [gradeHint, setGradeHint] = useState(initial?.gradeHint ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      title: title.trim(),
      content: content.trim(),
      difficulty,
      gradeHint: gradeHint.trim() || null,
    };

    try {
      const url = initial ? `/api/texts/${initial.id}` : "/api/texts";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      router.push("/professor/textos");
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
        Título
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Texto
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Dificuldade
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as TextDifficulty)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        >
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Série sugerida (opcional)
        <input
          value={gradeHint}
          onChange={(e) => setGradeHint(e.target.value)}
          placeholder="ex: 3-4"
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-60"
      >
        {loading ? "Salvando…" : initial ? "Atualizar texto" : "Criar texto"}
      </button>
    </form>
  );
}
