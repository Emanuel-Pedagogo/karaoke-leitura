import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { getSessionFromCookies } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getSessionFromCookies();

  return (
    <header className="border-b border-foreground/10 bg-card/80 backdrop-blur sticky top-0 z-50 max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 w-full">
      <Link href="/" className="font-bold text-lg text-primary">
        🎤 Karaokê de Leitura
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {session?.role === "STUDENT" && (
          <Link href="/aluno" className="hover:text-primary transition-colors">
            Aluno
          </Link>
        )}
        {session?.role === "TEACHER" && (
          <Link
            href="/professor"
            className="hover:text-primary transition-colors"
          >
            Professor
          </Link>
        )}
        {session?.role === "COORDINATOR" && (
          <Link
            href="/coordenador"
            className="hover:text-primary transition-colors"
          >
            Coordenador
          </Link>
        )}
        {!session && (
          <Link href="/entrar" className="hover:text-primary transition-colors">
            Entrar
          </Link>
        )}
        {session && <LogoutButton />}
        <ThemeToggle />
      </nav>
    </header>
  );
}
