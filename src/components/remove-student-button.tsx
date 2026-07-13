"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  studentId: string;
  studentName: string;
  redirectTo?: string;
};

export function RemoveStudentButton({
  studentId,
  studentName,
  redirectTo = "/professor/alunos",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    const confirmed = confirm(
      `Excluir "${studentName}" da turma?\n\nO aluno sairá desta turma, mas a conta e o histórico de leituras serão mantidos.`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao excluir");
      }
      router.push(redirectTo);
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
      onClick={() => void handleRemove()}
      disabled={loading}
      className="text-sm px-3 py-1 rounded border border-red-500/50 text-red-600 hover:bg-red-500/10 disabled:opacity-60"
    >
      {loading ? "…" : "Excluir"}
    </button>
  );
}
