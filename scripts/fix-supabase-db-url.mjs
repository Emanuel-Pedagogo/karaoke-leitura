import fs from "node:fs";

const path = ".env";
const text = fs.readFileSync(path, "utf8");
const match = text.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL não encontrado em .env");
  process.exit(1);
}

let url = match[1].trim().replace(/^"|"$/g, "");
const parsed = new URL(url);
const refMatch = parsed.username.match(/^postgres\.(.+)$/);
const projectRef = refMatch?.[1] ?? null;

if (parsed.hostname.includes("pooler.supabase.com")) {
  parsed.port = "6543";
  parsed.searchParams.set("pgbouncer", "true");
  parsed.searchParams.set("connection_limit", "1");
}

const newDatabaseUrl = parsed.toString();
let newText = text.replace(
  /^DATABASE_URL=.*$/m,
  `DATABASE_URL="${newDatabaseUrl}"`,
);

if (projectRef && !/^DIRECT_URL=/m.test(newText)) {
  const direct = new URL(url);
  direct.hostname = `db.${projectRef}.supabase.co`;
  direct.port = "5432";
  direct.search = "";
  if (!newText.endsWith("\n")) newText += "\n";
  newText += `DIRECT_URL="${direct.toString()}"\n`;
}

fs.writeFileSync(path, newText);
console.log(
  "DATABASE_URL atualizado:",
  parsed.port,
  parsed.searchParams.toString() || "(sem query)",
);
console.log(/^DIRECT_URL=/m.test(newText) ? "DIRECT_URL ok" : "DIRECT_URL ausente");
