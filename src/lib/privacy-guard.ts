import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import { requireStudentSession } from "@/lib/auth-guard";

export async function requireStudentWithPrivacy() {
  const session = await requireStudentSession();

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: {
      privacyAcceptedAt: true,
      privacyPolicyVersion: true,
      voiceConsentAt: true,
    },
  });

  const needsPrivacy =
    !student?.privacyAcceptedAt ||
    student.privacyPolicyVersion !== PRIVACY_POLICY_VERSION;

  if (needsPrivacy) {
    redirect("/aluno/consentimento");
  }

  return {
    session,
    hasVoiceConsent: Boolean(student?.voiceConsentAt),
  };
}
