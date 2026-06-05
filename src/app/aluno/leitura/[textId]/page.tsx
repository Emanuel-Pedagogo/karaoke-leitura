import { notFound } from "next/navigation";
import { averageWcpm, suggestKaraokeSpeed } from "@karaoke/shared";
import { prisma } from "@/lib/prisma";
import { hasClassSession } from "@/lib/class-session";
import { requireStudentWithPrivacy } from "@/lib/privacy-guard";
import { ReadingSessionClient } from "./reading-session-client";

export default async function LeituraPage({
  params,
  searchParams,
}: {
  params: Promise<{ textId: string }>;
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { session, hasVoiceConsent } = await requireStudentWithPrivacy();
  const { textId } = await params;
  const { fresh } = await searchParams;
  const classSession = await hasClassSession();
  const text = await prisma.readingText.findUnique({ where: { id: textId } });
  if (!text) notFound();

  const student = await prisma.studentProfile.findUnique({
    where: { id: session.studentId },
    include: {
      user: true,
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        select: { wcpm: true },
      },
    },
  });

  const avgWcpm = averageWcpm(student?.sessions.map((s) => s.wcpm) ?? []);
  const speedSuggestion = suggestKaraokeSpeed(avgWcpm, text.difficulty);

  return (
    <ReadingSessionClient
      key={fresh ?? text.id}
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
      initialSpeed={speedSuggestion.speed}
      speedHint={speedSuggestion}
      classSession={classSession}
    />
  );
}
