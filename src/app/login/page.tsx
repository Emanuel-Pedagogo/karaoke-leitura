"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

type ClassStudent = { id: string; name: string };

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"email" | "class">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [className, setClassName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao entrar");
      const dest =
        data.role === "STUDENT"
          ? "/aluno"
          : data.role === "COORDINATOR"
            ? "/coordenador"
            : data.role === "TEACHER"
              ? "/professor"
              : "/";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassStudents() {
    setError(null);
    setStudents([]);
    setStudentId("");
    try {
      const res = await fetch(
        `/api/auth/class-students?code=${encodeURIComponent(classCode)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Turma não encontrada");
      setClassName(data.className);
      setStudents(data.students);
      if (data.students.length === 1) {
        setStudentId(data.students[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar turma");
    }
  }

  async function handleClassLogin(e: FormEvent) {
    e.preventDefault();
    if (!studentId) {
      setError("Selecione seu nome na lista");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao entrar");
      router.push("/aluno");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="max-w-md mx-auto space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-muted text-sm">
          Use e-mail e senha ou o código da turma (alunos).
        </p>
      </header>

      <div className="flex rounded-lg border border-foreground/10 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            mode === "email" ? "bg-primary text-white" : "hover:bg-foreground/5"
          }`}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => setMode("class")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            mode === "class" ? "bg-primary text-white" : "hover:bg-foreground/5"
          }`}
        >
          Código da turma
        </button>
      </div>

      <Card>
        {mode === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <label className="block text-sm">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
                placeholder="aluno@demo.local"
              />
            </label>
            <label className="block text-sm">
              Senha
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
            <p className="text-xs text-muted">
              Demo: aluno@demo.local / aluno123 · professor@demo.local /
              professor123 · coordenador@demo.local / coord123
            </p>
          </form>
        ) : (
          <form onSubmit={handleClassLogin} className="space-y-4">
            <label className="block text-sm">
              Código da turma
              <input
                type="text"
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background uppercase"
                placeholder="TURMA3A"
              />
            </label>
            <button
              type="button"
              onClick={loadClassStudents}
              className="w-full py-2 rounded-lg border border-primary text-primary text-sm hover:bg-primary/10"
            >
              Buscar alunos da turma
            </button>
            {className && (
              <p className="text-sm text-muted">
                Turma: <strong>{className}</strong>
              </p>
            )}
            {students.length > 0 && (
              <label className="block text-sm">
                Seu nome
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
                >
                  <option value="">Selecione…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="submit"
              disabled={loading || students.length === 0}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar como aluno"}
            </button>
            <p className="text-xs text-muted">Demo: código TURMA3A</p>
          </form>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </Card>

      <p className="text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Voltar ao início
        </Link>
      </p>
    </article>
  );
}
