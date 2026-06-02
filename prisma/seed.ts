import { PrismaClient, TextDifficulty, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const alunoHash = await hashPassword("aluno123");
  const professorHash = await hashPassword("professor123");
  const coordHash = await hashPassword("coord123");

  const school = await prisma.school.upsert({
    where: { id: "seed-school" },
    update: {},
    create: { id: "seed-school", name: "Escola Modelo" },
  });

  const turma = await prisma.class.upsert({
    where: { id: "seed-class" },
    update: { accessCode: "TURMA3A" },
    create: {
      id: "seed-class",
      name: "3º Ano A",
      grade: "3",
      accessCode: "TURMA3A",
      schoolId: school.id,
    },
  });

  const alunoUser = await prisma.user.upsert({
    where: { email: "aluno@demo.local" },
    update: { passwordHash: alunoHash },
    create: {
      email: "aluno@demo.local",
      passwordHash: alunoHash,
      name: "Maria Silva",
      role: UserRole.STUDENT,
      student: {
        create: { classId: turma.id, xp: 120, level: 2 },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "professor@demo.local" },
    update: { passwordHash: professorHash },
    create: {
      email: "professor@demo.local",
      passwordHash: professorHash,
      name: "Prof. João",
      role: UserRole.TEACHER,
      teacher: { create: {} },
    },
  });

  const professorUser = await prisma.user.findUnique({
    where: { email: "professor@demo.local" },
    include: { teacher: true },
  });

  if (professorUser?.teacher) {
    await prisma.class.update({
      where: { id: turma.id },
      data: { teacherId: professorUser.teacher.id },
    });
  }

  await prisma.user.upsert({
    where: { email: "coordenador@demo.local" },
    update: { passwordHash: coordHash },
    create: {
      email: "coordenador@demo.local",
      passwordHash: coordHash,
      name: "Coord. Ana",
      role: UserRole.COORDINATOR,
      coordinator: { create: { schoolId: school.id } },
    },
  });

  const turmaB = await prisma.class.upsert({
    where: { id: "seed-class-b" },
    update: { accessCode: "TURMA3B" },
    create: {
      id: "seed-class-b",
      name: "3º Ano B",
      grade: "3",
      accessCode: "TURMA3B",
      schoolId: school.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "pedro@demo.local" },
    update: { passwordHash: alunoHash },
    create: {
      email: "pedro@demo.local",
      passwordHash: alunoHash,
      name: "Pedro Santos",
      role: UserRole.STUDENT,
      student: { create: { classId: turmaB.id, xp: 40, level: 1 } },
    },
  });

  await prisma.classGoal.upsert({
    where: { classId: turma.id },
    update: {},
    create: {
      classId: turma.id,
      title: "Meta de fluência — maio",
      targetWeeklyReadings: 2,
      minAccuracyPct: 80,
      minWcpm: 40,
    },
  });

  await prisma.classGoal.upsert({
    where: { classId: turmaB.id },
    update: {},
    create: {
      classId: turmaB.id,
      title: "Meta 3º B",
      targetWeeklyReadings: 1,
      minAccuracyPct: 75,
    },
  });

  const textos = [
    {
      title: "O gato e o rato",
      content:
        "O gato dormia no sol. O rato passou devagar. O gato abriu um olho e sorriu.",
      difficulty: TextDifficulty.INICIANTE,
      gradeHint: "1-2",
    },
    {
      title: "Viagem à escola",
      content:
        "De manhã cedo, Ana pegou sua mochila e saiu para a escola. No caminho, viu pássaros cantando nas árvores e sentiu o cheiro das flores.",
      difficulty: TextDifficulty.INTERMEDIARIO,
      gradeHint: "3-4",
    },
    {
      title: "O planeta azul",
      content:
        "Nossa Terra é um planeta azul visto do espaço. A água cobre grande parte da superfície e sustenta a vida de milhões de espécies.",
      difficulty: TextDifficulty.AVANCADO,
      gradeHint: "5+",
    },
  ];

  for (let i = 0; i < textos.length; i++) {
    const t = textos[i];
    const id = `seed-text-${i + 1}`;
    const wordCount = t.content.split(/\s+/).filter(Boolean).length;
    await prisma.readingText.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: t.title,
        content: t.content,
        difficulty: t.difficulty,
        gradeHint: t.gradeHint,
        wordCount,
      },
    });
  }

  const conquistas = [
    {
      slug: "primeira-leitura",
      title: "Primeira Leitura",
      description: "Concluiu sua primeira leitura no karaokê.",
      icon: "📖",
    },
    {
      slug: "fluente-10",
      title: "Leitor Fluente",
      description: "Atingiu 60+ palavras corretas por minuto.",
      icon: "⚡",
    },
    {
      slug: "precisao-ouro",
      title: "Precisão de Ouro",
      description: "Leu com 100% de precisão.",
      icon: "🏆",
    },
  ];

  for (const c of conquistas) {
    await prisma.achievement.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  await prisma.mission.upsert({
    where: { id: "seed-mission-daily" },
    update: {},
    create: {
      id: "seed-mission-daily",
      classId: turma.id,
      title: "Leitura do dia",
      description: "Complete 1 leitura hoje.",
      targetCount: 1,
      xpReward: 30,
    },
  });

  console.log("Seed OK:", {
    aluno: alunoUser.email,
    senhaAluno: "aluno123",
    professor: "professor@demo.local",
    senhaProfessor: "professor123",
    coordenador: "coordenador@demo.local",
    senhaCoordenador: "coord123",
    codigoTurmaA: "TURMA3A",
    codigoTurmaB: "TURMA3B",
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
