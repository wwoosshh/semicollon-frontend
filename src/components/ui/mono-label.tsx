import { cn } from "@/lib/utils";

export function MonoLabel({
  children,
  accent = false,
  className,
  as: As = "span",
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <As
      className={cn(
        "font-mono uppercase tracking-[0.12em] text-[0.6875rem] leading-none",
        accent ? "text-[var(--accent)]" : "text-[var(--muted-ink)]",
        className,
      )}
    >
      {children}
    </As>
  );
}
