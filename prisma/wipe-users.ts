import { PrismaClient } from "@prisma/client";
import { deleteAllUsers } from "../src/lib/delete-account";

const prisma = new PrismaClient();
const runSeed = process.argv.includes("--seed");

async function main() {
  const before = await prisma.user.count();
  await deleteAllUsers();
  console.log(`Usuários removidos: ${before}`);

  if (runSeed) {
    const { execSync } = await import("node:child_process");
    execSync("npm run db:seed", { stdio: "inherit", cwd: process.cwd() });
  } else {
    console.log(
      "Dica: rode com --seed para recriar contas demo (aluno@demo.local / aluno123).",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
