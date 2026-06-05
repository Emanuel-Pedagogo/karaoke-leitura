"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  getClassCodeClient,
  switchToStudent,
} from "@/lib/class-session-client";

type ClassStudent = { id: string; name: string };

const OFFLINE_CLASS_ERROR =
  "Não foi possível buscar alunos da turma. Verifique a conexão.";

function TrocarAlunoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [classCode, setClassCode] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const code = getClassCodeClient();
      if (!code) {
        setClassCode(null);
        return;
      }
      setClassCode(code);

      const [classRes, profileRes] = await Promise.all([
        fetch(`/api/auth/class-students?code=${encodeURIComponent(code)}`),
        fetch("/api/student/me"),
      ]);

      if (!classRes.ok) {
        throw new Error(OFFLINE_CLASS_ERROR);
      }

      const classData = await classRes.json();
      setClassName(classData.className ?? "");
      setStudents(classData.students ?? []);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCurrentStudentId(profile.student?.id ?? null);
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message ? e.message : OFFLINE_CLASS_ERROR,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSelectStudent(studentId: string) {
    if (!classCode || studentId === currentStudentId) {
      router.back();
      return;
    }

    setSwitchingId(studentId);
    setError(null);
    try {
      await switchToStudent(classCode, studentId);
      if (returnTo && returnTo.startsWith("/aluno")) {
        const separator = returnTo.includes("?") ? "&" : "?";
        router.replace(`${returnTo}${separator}fresh=${Date.now()}`);
        router.refresh();
        return;
      }
      router.replace("/aluno");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao trocar de aluno");
    } finally {
      setSwitchingId(null);
    }
  }

  if (loading) {
    return <p className="text-center py-12 text-muted">Carregando…</p>;
  }

  if (!classCode) {
    return (
      <article className="max-w-md mx-auto space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Turma não encontrada</h1>
        <p className="text-sm text-muted">
          Entre com o código da turma para usar o modo sala.
        </p>
        <Link
          href="/entrar?tipo=aluno"
          className="inline-block py-3 px-6 rounded-xl bg-primary text-white font-bold"
        >
          Entrar com código da turma
        </Link>
      </article>
    );
  }

  return (
    <article className="max-w-md mx-auto space-y-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Escolha o próximo aluno</h1>
        {className ? (
          <p className="text-sm text-muted">Turma: {className}</p>
        ) : null}
        <p className="text-sm text-muted">
          Toque no nome do aluno que vai ler agora. O dispositivo continua na
          mesma turma.
        </p>
      </header>

      {error ? (
        <Card className="!p-4 border-red-200 bg-red-50 space-y-2">
          <p className="text-sm text-red-700 text-center">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="w-full text-sm text-primary font-semibold hover:underline"
          >
            Tentar de novo
          </button>
        </Card>
      ) : null}

      <ul className="space-y-2">
        {students.map((student) => {
          const isCurrent = student.id === currentStudentId;
          const isSwitching = switchingId === student.id;
          return (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => void handleSelectStudent(student.id)}
                disabled={!!switchingId}
                className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-foreground/20 hover:border-primary"
                }`}
              >
                {isSwitching ? "Trocando…" : `${student.name}${isCurrent ? " (atual)" : ""}`}
              </button>
            </li>
          );
        })}
      </ul>

      {students.length === 0 && !error ? (
        <p className="text-sm text-muted text-center">
          Nenhum aluno nesta turma.
        </p>
      ) : null}

      <Link href="/aluno" className="block text-center text-sm text-muted hover:text-primary">
        ← Voltar ao início
      </Link>
    </article>
  );
}

export default function TrocarAlunoPage() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-muted">Carregando…</p>}>
      <TrocarAlunoContent />
    </Suspense>
  );
}
