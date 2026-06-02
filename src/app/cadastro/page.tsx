"use client";

import { FormEvent, useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

type RegisterRole = "STUDENT" | "TEACHER";

function CadastroContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tipo = params.get("tipo");

  const [role, setRole] = useState<RegisterRole>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  useEffect(() => {
    if (tipo === "aluno") setRole("STUDENT");
    if (tipo === "professor") setRole("TEACHER");
  }, [tipo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          password,
          classCode: role === "STUDENT" ? classCode || undefined : undefined,
          schoolName: role === "TEACHER" ? schoolName || undefined : undefined,
          className: role === "TEACHER" ? className || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar conta");

      if (data.classCode && role === "TEACHER") {
        setSuccessInfo(
          `Pronto! Passe este código aos alunos: ${data.classCode}`,
        );
        await new Promise((r) => setTimeout(r, 3000));
      }

      const dest =
        data.role === "STUDENT"
          ? "/aluno"
          : data.role === "TEACHER"
            ? "/professor"
            : "/";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  if (!tipo) {
    return (
      <article className="max-w-md mx-auto space-y-6 py-8 text-center">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted text-sm">Quem vai usar o app?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/cadastro?tipo=aluno"
            className="py-4 rounded-xl bg-primary text-white font-bold"
          >
            Sou aluno
          </Link>
          <Link
            href="/cadastro?tipo=professor"
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

  const isAluno = tipo === "aluno";

  return (
    <article className="max-w-md mx-auto space-y-6 py-4">
      <header className="text-center space-y-1">
        <p className="text-4xl" aria-hidden>
          {isAluno ? "📖" : "👨‍🏫"}
        </p>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted text-sm">
          {isAluno
            ? "Preencha seus dados para começar a ler."
            : "Preencha seus dados para criar sua turma."}
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            Seu nome
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
              placeholder="Maria Silva"
            />
          </label>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <label className="block text-sm">
            Confirmar senha
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
            />
          </label>

          {isAluno ? (
            <label className="block text-sm">
              Código da turma{" "}
              <span className="text-muted">(se o professor passou)</span>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background uppercase"
                placeholder="Opcional"
              />
            </label>
          ) : (
            <>
              <label className="block text-sm">
                Nome da escola{" "}
                <span className="text-muted">(opcional)</span>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
                />
              </label>
              <label className="block text-sm">
                Nome da turma{" "}
                <span className="text-muted">(opcional)</span>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
                  placeholder="3º Ano A"
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
          >
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        {successInfo ? (
          <p className="mt-4 text-sm text-green-700 font-medium">{successInfo}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Card>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link
          href={`/entrar?tipo=${tipo}`}
          className="text-primary font-semibold hover:underline"
        >
          Entrar
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

export default function CadastroPage() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-muted">Carregando…</p>}>
      <CadastroContent />
    </Suspense>
  );
}
