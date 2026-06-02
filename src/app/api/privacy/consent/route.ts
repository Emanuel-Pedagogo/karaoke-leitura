import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  PRIVACY_POLICY_VERSION,
  validateConsentPayload,
} from "@/lib/privacy";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";

const SESSION_INVALID =
  "Sessão inválida ou expirada. Saia da conta e entre novamente.";

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function OPTIONS() {
  return optionsWithCors();
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.studentId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  const existing = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: { id: true },
  });
  if (!existing) {
    return jsonWithCors({ error: SESSION_INVALID }, { status: 401 });
  }

  try {
    const body = await request.json();
    const error = validateConsentPayload(body);
    if (error) {
      return jsonWithCors({ error }, { status: 400 });
    }

    const now = new Date();

    await prisma.studentProfile.update({
      where: { id: session.studentId },
      data: {
        privacyAcceptedAt: now,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        voiceConsentAt: body.acceptVoice ? now : null,
        voiceConsentGuardian: Boolean(body.guardianConfirmed),
      },
    });

    return jsonWithCors({
      ok: true,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      voiceEnabled: Boolean(body.acceptVoice),
    });
  } catch (e) {
    if (isRecordNotFound(e)) {
      return jsonWithCors({ error: SESSION_INVALID }, { status: 401 });
    }
    console.error(e);
    return jsonWithCors({ error: "Erro ao registrar consentimento" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.studentId) {
    return jsonWithCors({ error: "Não autorizado" }, { status: 401 });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: {
      privacyAcceptedAt: true,
      privacyPolicyVersion: true,
      voiceConsentAt: true,
      voiceConsentGuardian: true,
    },
  });

  if (!student) {
    return jsonWithCors({ error: SESSION_INVALID }, { status: 401 });
  }

  const needsPrivacy =
    !student.privacyAcceptedAt ||
    student.privacyPolicyVersion !== PRIVACY_POLICY_VERSION;

  return jsonWithCors({
    needsPrivacy,
    hasVoiceConsent: Boolean(student.voiceConsentAt),
    policyVersion: PRIVACY_POLICY_VERSION,
    currentVersion: student.privacyPolicyVersion,
  });
}
