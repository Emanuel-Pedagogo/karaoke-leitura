import { suggestTextsForStudent } from "@/lib/reading-assistant";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getSessionFromRequest } from "@/lib/auth";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.studentId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  const suggestions = await suggestTextsForStudent(session.studentId);
  return jsonWithCors({ suggestions });
}
