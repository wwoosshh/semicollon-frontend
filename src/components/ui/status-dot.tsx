import { cn } from "@/lib/utils";

export function StatusDot({
  children,
  color = "var(--accent)",
  className,
}: {
  children?: React.ReactNode;
  /** any CSS color; defaults to vermillion accent (active/OPEN) */
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono uppercase tracking-[0.12em] text-[0.6875rem] leading-none text-[var(--ink-2)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}
