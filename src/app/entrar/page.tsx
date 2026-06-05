"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

type LoginMode = "email" | "class";

function EntrarContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tipo = params.get("tipo");

  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [className, setClassName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAluno = tipo === "aluno";
  const isProfessor = tipo === "professor";
  const showClassLogin = !tipo || isAluno;

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
      if (data.students.length === 1) setStudentId(data.students[0].id);
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

  if (!tipo) {
    return (
      <article className="max-w-md mx-auto space-y-6 py-8 text-center">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-muted text-sm">Quem está acessando?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/entrar?tipo=aluno"
            className="py-4 rounded-xl bg-primary text-white font-bold"
          >
            Sou aluno
          </Link>
          <Link
            href="/entrar?tipo=professor"
            className="py-4 rounded-xl border border-primary text-primary font-bold"
          >
            Sou professor
          </Link>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-primary">
          ← Voltar
        </Link>
      </article>
    );
  }

  if (mode === "class" && showClassLogin) {
    return (
      <article className="max-w-md mx-auto space-y-6 py-4">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Celular compartilhado da turma</h1>
          <p className="text-sm text-muted">
            Modo sala: digite o código da turma e escolha o aluno que vai ler.
          </p>
        </header>
        <Card>
          <form onSubmit={handleClassLogin} className="space-y-4">
            <label className="block text-sm">
              Código da turma
              <input
                type="text"
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background uppercase"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadClassStudents()}
              className="w-full py-2 rounded-lg border border-primary text-primary text-sm"
            >
              Buscar meu nome
            </button>
            {className ? (
              <p className="text-sm text-muted">
                Turma: <strong>{className}</strong>
              </p>
            ) : null}
            {students.length > 0 ? (
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
            ) : null}
            <button
              type="submit"
              disabled={loading || students.length === 0}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </Card>
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setError(null);
          }}
          className="w-full text-sm text-primary hover:underline"
        >
          Entrar com e-mail e senha
        </button>
        <p className="text-center text-sm">
          <Link href={`/comecar?tipo=aluno`} className="text-muted hover:text-primary">
            ← Voltar
          </Link>
        </p>
      </article>
    );
  }

  return (
    <article className="max-w-md mx-auto space-y-6 py-4">
      <header className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-sm text-muted">
          {isAluno
            ? "Use o e-mail e a senha da sua conta."
            : "Use o e-mail e a senha do professor."}
        </p>
      </header>

      <Card>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
              placeholder="voce@email.com"
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
            className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Card>

      {showClassLogin ? (
        <button
          type="button"
          onClick={() => {
            setMode("class");
            setError(null);
          }}
          className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
        >
          Usar celular compartilhado da turma
        </button>
      ) : null}

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link
          href={`/cadastro?tipo=${tipo}`}
          className="text-primary font-semibold hover:underline"
        >
          Criar conta
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link href={`/comecar?tipo=${tipo}`} className="text-muted hover:text-primary">
          ← Voltar
        </Link>
      </p>
    </article>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-muted">Carregando…</p>}>
      <EntrarContent />
    </Suspense>
  );
}
