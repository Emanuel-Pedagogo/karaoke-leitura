"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EraseVoiceDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleErase() {
    if (
      !confirm(
        "Apagar todas as transcrições de voz das suas leituras? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/privacy/erase-voice-data", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setMessage(data.message ?? "Dados apagados.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleErase()}
        disabled={loading}
        className="px-4 py-2 rounded-lg border border-red-500/50 text-red-700 text-sm hover:bg-red-500/10 disabled:opacity-60"
      >
        {loading ? "Apagando…" : "Apagar transcrições de voz"}
      </button>
      {message && <p className="text-xs text-muted mt-2">{message}</p>}
    </div>
  );
}
