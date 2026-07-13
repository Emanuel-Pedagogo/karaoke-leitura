"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type StudentFormData = {
  name: string;
  email: string;
};

type Props = {
  initial: StudentFormData & { id: string };
};

export function StudentForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      router.push(`/professor/aluno/${initial.id}`);
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
        Nome
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        E-mail
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2"
        />
      </label>
      <p className="text-xs text-muted">
        A senha do aluno não é alterada nesta tela.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
