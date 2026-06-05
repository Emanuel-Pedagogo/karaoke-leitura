"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasClassSessionClient } from "@/lib/class-session-client";

export function LogoutButton() {
  const router = useRouter();
  const [classSession, setClassSession] = useState(false);

  useEffect(() => {
    setClassSession(hasClassSessionClient());
  }, []);

  async function handleLogout() {
    if (classSession) {
      const confirmed = window.confirm(
        "Sair da turma? O código da turma será esquecido neste dispositivo.",
      );
      if (!confirmed) return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(classSession ? "/entrar?tipo=aluno" : "/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="text-xs px-2 py-1 rounded border border-foreground/20 hover:bg-foreground/5"
    >
      {classSession ? "Sair da turma" : "Sair"}
    </button>
  );
}
