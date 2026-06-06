import { PilotFeedbackSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import {
  mapTriStateForDb,
  validatePilotFeedbackBody,
} from "@/lib/pilot-feedback-validate";
import { rateLimitByRequest } from "@/lib/rate-limit";

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  const limited = rateLimitByRequest(request, "pilot-feedback", {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = validatePilotFeedbackBody(body);
    if (!validation.data) {
      return jsonWithCors(
        { error: validation.error ?? "Dados inválidos" },
        { status: 400 },
        request,
      );
    }

    const session = await getSessionFromRequest(request);
    const payload = validation.data;

    await prisma.pilotFeedback.create({
      data: {
        userId: session?.userId,
        studentId: session?.studentId,
        role: session?.role,
        source:
          payload.source === "MOBILE"
            ? PilotFeedbackSource.MOBILE
            : PilotFeedbackSource.WEB,
        appVersion: payload.appVersion,
        screen: payload.screen,
        category: payload.category,
        message: payload.message,
        internetQuality: payload.internetQuality,
        aiWorked: mapTriStateForDb(payload.aiWorked),
        readingWorked: mapTriStateForDb(payload.readingWorked),
      },
    });

    return jsonWithCors({ ok: true }, { status: 201 }, request);
  } catch (error) {
    console.error("pilot-feedback", error);
    return jsonWithCors(
      { error: "Não foi possível salvar o feedback" },
      { status: 500 },
      request,
    );
  }
}
