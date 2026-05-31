import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}
