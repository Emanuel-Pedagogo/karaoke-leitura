import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { ReadingSessionClient } from "./reading-session-client";

export default async function LeituraPage({
  params,
}: {
  params: Promise<{ textId: string }>;
}) {
  const { session, hasVoiceConsent } = await requireStudentWithPrivacy();
  const { textId } = await params;
  const text = await prisma.readingText.findUnique({ where: { id: textId } });
  if (!text) notFound();

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    include: { user: true },
  });

  return (
    <ReadingSessionClient
      text={{
        id: text.id,
        title: text.title,
        content: text.content,
        wordCount: text.wordCount,
      }}
      studentId={student?.id}
      studentName={student?.user.name ?? "Estudante"}
      comboStreak={student?.comboStreak ?? 0}
      hasVoiceConsent={hasVoiceConsent}
    />
  );
}
