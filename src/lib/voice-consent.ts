import { prisma } from "@/lib/prisma";

export async function studentHasVoiceConsent(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { voiceConsentAt: true },
  });
  return Boolean(student?.voiceConsentAt);
}
