import { PilotFeedbackSource, UsageEventType } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { rateLimitByRequest } from "@/lib/rate-limit";
import { recordUsageEvent } from "@/lib/usage-events";

// Eventos que o servidor não consegue observar sozinho — o cliente registra.
const CLIENT_EVENT_TYPES: UsageEventType[] = [
  UsageEventType.READING_STARTED,
  UsageEventType.OFFLINE_SYNC,
  UsageEventType.APP_ERROR,
];

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  const limited = rateLimitByRequest(request, "usage-events", {
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const type = CLIENT_EVENT_TYPES.find((item) => item === body?.type);
    if (!type) {
      return jsonWithCors({ error: "Evento inválido" }, { status: 400 }, request);
    }

    const metadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata) &&
      JSON.stringify(body.metadata).length <= 2000
        ? (body.metadata as Record<string, unknown>)
        : {};

    const appVersion =
      typeof body.appVersion === "string" && body.appVersion.trim()
        ? body.appVersion.trim().slice(0, 60)
        : undefined;

    const session = await getSessionFromRequest(request);

    await recordUsageEvent({
      request,
      session,
      type,
      metadata,
      appVersion,
      source:
        body.source === "MOBILE" ? PilotFeedbackSource.MOBILE : undefined,
    });

    return jsonWithCors({ ok: true }, { status: 201 }, request);
  } catch {
    // Telemetria nunca devolve erro que atrapalhe o cliente.
    return jsonWithCors({ ok: false }, { status: 200 }, request);
  }
}
