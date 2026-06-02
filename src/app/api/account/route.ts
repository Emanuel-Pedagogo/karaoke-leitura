import { getSessionFromRequest, SESSION_COOKIE } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/delete-account";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";

export async function OPTIONS() {
  return optionsWithCors();
}

/** Exclusão total da conta — art. 18 LGPD (eliminação). */
export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { confirm?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as { confirm?: string };
  } catch {
    return jsonWithCors({ error: "Corpo inválido" }, { status: 400 });
  }

  if (body.confirm !== "ENCERRAR") {
    return jsonWithCors(
      {
        error:
          'Confirme digitando confirm: "ENCERRAR" no corpo da requisição.',
      },
      { status: 400 },
    );
  }

  try {
    const result = await deleteUserAccount(session.userId);
    if (!result.deleted) {
      return jsonWithCors({ error: "Conta não encontrada" }, { status: 404 });
    }

    const response = jsonWithCors({
      ok: true,
      message:
        "Conta encerrada. Seus dados pessoais e histórico de leituras foram excluídos.",
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (e) {
    console.error(e);
    return jsonWithCors({ error: "Erro ao encerrar conta" }, { status: 500 });
  }
}
