"use client";

import { useRouter } from "next/navigation";

export function ClassModeExitButton() {
  const router = useRouter();

  async function handleExit() {
    const confirmed = window.confirm(
      "Sair da turma? O código da turma será esquecido neste dispositivo.",
    );
    if (!confirmed) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/entrar?tipo=aluno");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleExit()}
      className="text-sm text-muted hover:text-primary font-semibold"
    >
      Sair da turma
    </button>
  );
}
