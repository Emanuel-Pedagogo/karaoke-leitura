import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentSession } from "@/lib/auth-guard";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import { PrivacyConsentForm } from "@/components/privacy-consent-form";

export default async function ConsentimentoPage({
  searchParams,
}: {
  searchParams?: Promise<{ voz?: string; returnTo?: string }>;
}) {
  const session = await requireStudentSession();
  const params = (await searchParams) ?? {};
  const focusVoice = params.voz === "1";
  const redirectTo =
    typeof params.returnTo === "string" && params.returnTo.startsWith("/aluno")
      ? params.returnTo
      : "/aluno";

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: { privacyAcceptedAt: true, privacyPolicyVersion: true },
  });

  const hasCurrentPrivacy = Boolean(
    student?.privacyAcceptedAt &&
      student.privacyPolicyVersion === PRIVACY_POLICY_VERSION,
  );

  if (hasCurrentPrivacy && !focusVoice) {
    redirect("/aluno");
  }

  return (
    <article>
      <PrivacyConsentForm
        initialAcceptPrivacy={hasCurrentPrivacy}
        focusVoice={focusVoice}
        redirectTo={redirectTo}
      />
    </article>
  );
}
