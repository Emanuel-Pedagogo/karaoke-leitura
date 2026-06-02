"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

type RegisterRole = "STUDENT" | "TEACHER";

export default function CadastroPage() {
  const router = useRouter();
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
          `Conta criada! Código da turma para seus alunos: ${data.classCode}`,
        );
        await new Promise((r) => setTimeout(r, 2500));
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

  return (
    <article className="max-w-md mx-auto space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="text-muted text-sm">
          Cadastre-se como aluno ou professor.
        </p>
      </header>

      <div className="flex rounded-lg border border-foreground/10 p-1 gap-1">
        <button
          type="button"
          onClick={() => setRole("STUDENT")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            role === "STUDENT"
              ? "bg-primary text-white"
              : "hover:bg-foreground/5"
          }`}
        >
          Aluno
        </button>
        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            role === "TEACHER"
              ? "bg-primary text-white"
              : "hover:bg-foreground/5"
          }`}
        >
          Professor
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            Nome completo
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background"
              placeholder="Seu nome"
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

          {role === "STUDENT" ? (
            <label className="block text-sm">
              Código da turma{" "}
              <span className="text-muted">(opcional)</span>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-foreground/20 px-3 py-2 bg-background uppercase"
                placeholder="Ex.: ABC123"
              />
              <span className="text-xs text-muted mt-1 block">
                Se não tiver código, criamos uma conta individual para você.
              </span>
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
                  placeholder="Escola Municipal..."
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
            className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        {successInfo ? (
          <p className="mt-4 text-sm text-green-700 font-medium" role="status">
            {successInfo}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </Card>

      <p className="text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </article>
  );
}
