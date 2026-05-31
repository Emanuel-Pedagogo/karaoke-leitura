import Link from "next/link";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/10 mt-12 py-6 text-center text-xs text-muted max-w-5xl mx-auto px-4 w-full">
      <p>
        Karaokê de Leitura · Dados tratados conforme a LGPD ·{" "}
        <Link href="/privacidade" className="text-primary hover:underline">
          Privacidade
        </Link>
        {" · "}
        v{PRIVACY_POLICY_VERSION}
      </p>
    </footer>
  );
}
