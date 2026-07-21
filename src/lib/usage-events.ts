import {
  PilotFeedbackSource,
  Prisma,
  UsageEventType,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export { UsageEventType };

type SessionInfo = {
  userId?: string;
  studentId?: string;
  role?: UserRole;
} | null;

// Requisições do app Android autenticam via Bearer token; a web usa cookie.
export function usageSourceFromRequest(request: Request): PilotFeedbackSource {
  return request.headers.get("authorization")
    ? PilotFeedbackSource.MOBILE
    : PilotFeedbackSource.WEB;
}

// Telemetria do piloto nunca pode travar o fluxo de quem usa o app — falha é silenciosa.
export async function recordUsageEvent(params: {
  request: Request;
  session?: SessionInfo;
  type: UsageEventType;
  metadata?: Record<string, unknown>;
  appVersion?: string;
  source?: PilotFeedbackSource;
}): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        userId: params.session?.userId,
        studentId: params.session?.studentId,
        role: params.session?.role,
        source: params.source ?? usageSourceFromRequest(params.request),
        appVersion:
          params.appVersion ??
          params.request.headers.get("x-app-version") ??
          undefined,
        type: params.type,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonObject,
      },
    });
  } catch (error) {
    console.warn("[usage-events] falha ao registrar evento", params.type, error);
  }
}
