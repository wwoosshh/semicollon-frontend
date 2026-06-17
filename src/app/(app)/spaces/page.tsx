"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  type SpaceListItem,
  type SpaceStatus,
  statusColor,
  typeEn,
} from "@/lib/spaces";
import { SectionHeader } from "@/components/ui/section-header";
import { MonoLabel } from "@/components/ui/mono-label";
import { StatusDot } from "@/components/ui/status-dot";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 전체 + 4 most-used statuses as a horizontal mono filter row.
const FILTERS: { label: string; value: SpaceStatus | null }[] = [
  { label: "전체", value: null },
  { label: "제안중", value: "제안중" },
  { label: "모집중", value: "모집중" },
  { label: "진행중", value: "진행중" },
  { label: "완료", value: "완료" },
];

function FilterRow({
  active,
  onChange,
}: {
  active: SpaceStatus | null;
  onChange: (v: SpaceStatus | null) => void;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2">
      <MonoLabel className="text-[var(--muted-ink)]">FILTER /</MonoLabel>
      {FILTERS.map((f) => {
        const on = active === f.value;
        return (
          <button
            key={f.label}
            type="button"
            onClick={() => onChange(f.value)}
            aria-pressed={on}
            className={cn(
              "font-mono text-[0.75rem] uppercase tracking-[0.1em] transition-colors",
              on
                ? "text-[var(--accent)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]",
            )}
          >
            <span
              className={cn(
                "border-b pb-0.5",
                on ? "border-[var(--accent)]" : "border-transparent",
              )}
            >
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SpaceCard({ space, index }: { space: SpaceListItem; index: number }) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group relative flex flex-col gap-4 bg-[var(--paper)] p-6 transition-colors hover:bg-[var(--paper-2)]"
    >
      {/* left accent rule on hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-px bg-transparent transition-colors group-hover:bg-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-baseline gap-2.5">
          <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
            {num}
          </span>
          <MonoLabel accent>{typeEn(space.type)}</MonoLabel>
        </span>
        <StatusDot color={statusColor(space.status)}>{space.status}</StatusDot>
      </div>

      <h3 className="font-serif text-xl font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
        {space.title}
      </h3>

      <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-[var(--ink-2)]">
        {space.description || "—"}
      </p>

      <div className="mt-1 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <span className="font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)]">
          {space.member_count}명
        </span>
        <span className="font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink-2)] transition-colors group-hover:text-[var(--accent)]">
          자세히 →
        </span>
      </div>
    </Link>
  );
}

export default function SpacesPage() {
  const [filter, setFilter] = useState<SpaceStatus | null>(null);
  const { data: spaces, isLoading } = useQuery<SpaceListItem[]>({
    queryKey: ["spaces"],
    queryFn: () => api<SpaceListItem[]>("/spaces"),
  });

  const visible = spaces?.filter((s) => !filter || s.status === filter);

  return (
    <div>
      <SectionHeader
        number="03"
        title="활동공간"
        right={
          <Link
            href="/spaces/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "font-mono text-[0.75rem] tracking-[0.08em]",
            )}
          >
            활동 제안하기 →
          </Link>
        }
      />

      <FilterRow active={filter} onChange={setFilter} />

      {isLoading && (
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          LOADING…
        </p>
      )}

      {visible && visible.length > 0 && (
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s, i) => (
            <SpaceCard key={s.id} space={s} index={i} />
          ))}
        </div>
      )}

      {visible && visible.length === 0 && (
        <div className="border border-[var(--line)] px-6 py-16 text-center">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
            {filter
              ? `${filter} 상태의 활동공간이 없습니다`
              : "아직 활동공간이 없습니다 — 첫 활동을 제안해보세요"}
          </p>
        </div>
      )}
    </div>
  );
}
