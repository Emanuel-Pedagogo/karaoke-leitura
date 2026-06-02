"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** Rota após exclusão (padrão: login). */
  redirectTo?: string;
};

export function DeleteAccountButton({ redirectTo = "/login" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typed, setTyped] = useState("");

  async function handleDelete() {
    if (typed !== "ENCERRAR") {
      setMessage('Digite exatamente ENCERRAR para confirmar.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "ENCERRAR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao encerrar conta");
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 rounded-lg border border-red-600/60 text-red-700 text-sm font-medium hover:bg-red-500/10"
      >
        Encerrar e excluir minha conta
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Isso apaga sua conta, histórico de leituras, XP, conquistas e missões.
        <strong className="text-foreground"> Não pode ser desfeito.</strong>
      </p>
      <label className="block text-sm">
        Digite <strong>ENCERRAR</strong> para confirmar
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
          autoComplete="off"
          disabled={loading}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={loading || typed !== "ENCERRAR"}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Excluindo…" : "Confirmar exclusão"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false);
            setTyped("");
            setMessage(null);
          }}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-foreground/20 text-sm hover:bg-foreground/5"
        >
          Cancelar
        </button>
      </div>
      {message && <p className="text-xs text-red-700">{message}</p>}
    </div>
  );
}
