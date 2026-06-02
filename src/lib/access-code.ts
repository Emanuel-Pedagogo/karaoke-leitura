import { prisma } from "@/lib/prisma";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** Gera código de turma único (ex.: TURMA3A). */
export async function generateUniqueClassCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode(6);
    const exists = await prisma.class.findFirst({
      where: { accessCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Não foi possível gerar código da turma");
}
