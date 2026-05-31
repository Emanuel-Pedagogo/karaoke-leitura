"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  textId: string;
  title: string;
};

export function DeleteTextButton({ textId, title }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir o texto "${title}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/texts/${textId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao excluir");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm px-3 py-1 rounded border border-red-500/50 text-red-600 hover:bg-red-500/10 disabled:opacity-60"
    >
      {loading ? "…" : "Excluir"}
    </button>
  );
}
