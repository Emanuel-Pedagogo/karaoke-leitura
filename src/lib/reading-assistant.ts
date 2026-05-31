import { prisma } from "@/lib/prisma";
import { DIFFICULTY_LABELS } from "@/lib/utils";
import type { TextDifficulty } from "@prisma/client";

export type AssistantTip = {
  icon: string;
  title: string;
  message: string;
};

export async function getStudentAssistantTips(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) return { tips: [], studentName: "Estudante" };

  const tips: AssistantTip[] = [];
  const sessions = student.sessions;

  if (sessions.length === 0) {
    tips.push({
      icon: "📖",
      title: "Primeira leitura",
      message:
        "Comece por um texto Iniciante e leia em voz alta com calma. Use o microfone para receber sugestões automáticas.",
    });
    return { tips, studentName: student.user.name };
  }

  const avgAccuracy =
    sessions.reduce((a, s) => a + (s.accuracyPct ?? 0), 0) / sessions.length;
  const avgWcpm =
    sessions.reduce((a, s) => a + (s.wcpm ?? 0), 0) / sessions.length;
  const last = sessions[0];

  if (avgAccuracy < 80) {
    tips.push({
      icon: "🎯",
      title: "Precisão",
      message:
        "Tente ler mais devagar e olhar cada palavra antes de falar. Ative a análise por voz para ver omissões e trocas.",
    });
  } else if (avgAccuracy >= 95) {
    tips.push({
      icon: "⭐",
      title: "Ótimo trabalho",
      message:
        "Sua precisão está excelente! Experimente textos Intermediário ou Avançado.",
    });
  }

  if (avgWcpm < 45) {
    tips.push({
      icon: "🐢",
      title: "Ritmo",
      message:
        "Pratique a mesma leitura duas vezes esta semana. O ritmo melhora com repetição em voz alta.",
    });
  } else if (avgWcpm >= 70) {
    tips.push({
      icon: "⚡",
      title: "Fluência",
      message:
        "Você já lê com bom ritmo. Foque na prosódia (entonação) marcando pausas nas vírgulas.",
    });
  }

  if (student.comboStreak >= 3) {
    tips.push({
      icon: "🔥",
      title: "Combo ativo",
      message: `Sequência de ${student.comboStreak} leituras precisas! Continue para ganhar mais XP.`,
    });
  }

  if (last.prosodyScore != null && last.prosodyScore < 3) {
    tips.push({
      icon: "🎭",
      title: "Prosódia",
      message:
        "Leia com expressão: mude o tom em perguntas e frases emocionantes.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: "👍",
      title: "Continue praticando",
      message:
        "Faça pelo menos uma leitura por dia. O assistente usa seu histórico para personalizar dicas.",
    });
  }

  return { tips, studentName: student.user.name, avgAccuracy, avgWcpm };
}

const DIFFICULTY_ORDER: TextDifficulty[] = [
  "INICIANTE",
  "INTERMEDIARIO",
  "AVANCADO",
];

export async function suggestTextsForStudent(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      sessions: {
        where: { completedAt: { not: null } },
        include: { text: true },
      },
    },
  });

  const allTexts = await prisma.readingText.findMany({
    orderBy: { difficulty: "asc" },
  });

  if (!student) return [];

  const readIds = new Set(student.sessions.map((s) => s.textId));
  const avgWcpm =
    student.sessions.length > 0
      ? student.sessions.reduce((a, s) => a + (s.wcpm ?? 0), 0) /
        student.sessions.length
      : 0;

  let targetDifficulty: TextDifficulty = "INICIANTE";
  if (avgWcpm >= 55) targetDifficulty = "INTERMEDIARIO";
  if (avgWcpm >= 75) targetDifficulty = "AVANCADO";

  const targetIdx = DIFFICULTY_ORDER.indexOf(targetDifficulty);

  return allTexts
    .map((text) => {
      const diffIdx = DIFFICULTY_ORDER.indexOf(text.difficulty);
      const unread = !readIds.has(text.id);
      let score = unread ? 10 : 0;
      if (diffIdx === targetIdx) score += 8;
      if (Math.abs(diffIdx - targetIdx) === 1) score += 4;
      return {
        id: text.id,
        title: text.title,
        difficulty: text.difficulty,
        difficultyLabel: DIFFICULTY_LABELS[text.difficulty],
        wordCount: text.wordCount,
        gradeHint: text.gradeHint,
        reason: unread
          ? diffIdx === targetIdx
            ? "Recomendado para seu nível — ainda não lido"
            : "Novo para você"
          : diffIdx === targetIdx
            ? "Boa revisão no seu nível"
            : "Prática extra",
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
