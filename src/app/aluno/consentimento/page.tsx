import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentSession } from "@/lib/auth-guard";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import { PrivacyConsentForm } from "@/components/privacy-consent-form";

export default async function ConsentimentoPage() {
  const session = await requireStudentSession();

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    select: { privacyAcceptedAt: true, privacyPolicyVersion: true },
  });

  if (
    student?.privacyAcceptedAt &&
    student.privacyPolicyVersion === PRIVACY_POLICY_VERSION
  ) {
    redirect("/aluno");
  }

  return (
    <article>
      <PrivacyConsentForm />
    </article>
  );
}
