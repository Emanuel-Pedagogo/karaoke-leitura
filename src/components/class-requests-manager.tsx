"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type JoinRequest = {
  id: string;
  student: { user: { name: string; email: string } };
  class: { name: string };
  type: "CODE_JOIN" | "TEACHER_INVITE";
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export function ClassRequestsManager({ classId }: { classId: string }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/class-requests/teacher");
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
      else setError(data.error);
    } catch (e) {
      setError("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, action: "ACCEPT" | "REJECT") {
    try {
      const res = await fetch("/api/class-requests/teacher", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: action === "ACCEPT" ? "Solicitação aprovada" : "Solicitação recusada", type: "success" });
      fetchRequests();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Erro", type: "error" });
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/class-requests/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, classId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: `Convite enviado para ${data.studentName}. O aluno verá em Minha Turma no app (mesmo e-mail da conta).`, type: "success" });
      setEmail("");
      fetchRequests();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Erro ao convidar", type: "error" });
    } finally {
      setInviting(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-success/10 text-success" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-bold">Convidar Aluno</h2>
        <p className="text-sm text-muted">
          Se o aluno já possui conta, digite o <strong>e-mail exato</strong> do
          cadastro dele. O convite aparece no app do aluno em{" "}
          <strong>Minha Turma</strong> (banner verde na tela inicial).
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail do aluno"
            className="flex-1 rounded-lg border border-foreground/20 px-3 py-2 text-sm"
            required
            disabled={inviting}
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {inviting ? "Enviando..." : "Convidar"}
          </button>
        </form>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-bold">Solicitações Pendentes</h2>
        <p className="text-sm text-muted">
          Alunos que tentaram entrar com o código da turma ou que ainda não aceitaram seu convite.
        </p>

        {requests.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma solicitação pendente.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map(req => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-4 p-3 border border-foreground/10 rounded-lg">
                <div>
                  <p className="font-medium">{req.student.user.name}</p>
                  <p className="text-xs text-muted">{req.student.user.email}</p>
                  <p className="text-xs mt-1 text-primary">
                    {req.type === "CODE_JOIN" ? "Usou o código da turma" : "Convidado por você"}
                  </p>
                </div>
                {req.type === "CODE_JOIN" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, "ACCEPT")}
                      className="px-3 py-1.5 rounded bg-success text-white text-xs font-medium"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "REJECT")}
                      className="px-3 py-1.5 rounded border border-foreground/20 text-xs font-medium"
                    >
                      Recusar
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Aguardando aluno aceitar</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
