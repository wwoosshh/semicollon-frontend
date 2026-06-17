import { cn } from "@/lib/utils";

export function SectionHeader({
  number,
  title,
  right,
  className,
}: {
  number?: string;
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-end justify-between gap-4 pb-3">
        <div className="flex items-baseline gap-3">
          {number && (
            <span className="font-mono text-sm font-medium tracking-[0.1em] text-[var(--accent)]">
              {number}
            </span>
          )}
          <h2 className="font-serif text-2xl font-bold leading-tight text-[var(--ink)]">
            {title}
          </h2>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="h-px w-full bg-[var(--line)]" />
    </div>
  );
}
