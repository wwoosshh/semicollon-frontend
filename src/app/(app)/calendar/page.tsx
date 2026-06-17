"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, startOfMonth } from "date-fns";
import {
  type EventItem,
  listEvents,
  kindColor,
  formatTime,
} from "@/lib/events";
import { formatDate } from "@/lib/content";
import { useMe } from "@/lib/use-me";
import { SectionHeader } from "@/components/ui/section-header";
import { MonoLabel } from "@/components/ui/mono-label";
import { buttonVariants } from "@/components/ui/button";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { cn } from "@/lib/utils";

function UpcomingRow({ e }: { e: EventItem }) {
  return (
    <Link
      href={`/events/${e.id}`}
      className="group flex flex-col gap-2 border-b border-[var(--line)] py-4 transition-colors hover:bg-[var(--paper-2)] sm:flex-row sm:items-center sm:gap-5"
    >
      {/* Date + time (mono) */}
      <span className="flex shrink-0 items-baseline gap-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)] sm:w-44">
        <span>{formatDate(e.starts_at)}</span>
        <span className="text-[var(--muted-ink)]">{formatTime(e.starts_at)}</span>
      </span>

      {/* Kind chip */}
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          aria-hidden
          className="inline-block h-2 w-2"
          style={{ background: kindColor(e.kind) }}
        />
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
          {e.kind}
        </span>
      </span>

      {/* Title */}
      <h3 className="font-serif text-[1.0625rem] font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:flex-1">
        {e.title}
      </h3>

      {/* Location + space badge */}
      <span className="flex shrink-0 items-center gap-3">
        {e.location && (
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--muted-ink)]">
            {e.location}
          </span>
        )}
        {e.space_title && (
          <span className="border border-[var(--line)] px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--ink-2)]">
            {e.space_title}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function CalendarPage() {
  const { data: me } = useMe();
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));

  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });

  const list = events ?? [];
  const now = Date.now();
  const upcoming = list
    .filter((e) => new Date(e.starts_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  return (
    <div>
      <SectionHeader
        number="05"
        title="캘린더"
        right={
          me?.role === "운영진" ? (
            <Link
              href="/calendar/new"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "font-mono text-[0.75rem] tracking-[0.08em]",
              )}
            >
              일정 추가 →
            </Link>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          LOADING…
        </p>
      ) : (
        <MonthCalendar
          events={list}
          month={month}
          onPrev={() => setMonth((m) => subMonths(m, 1))}
          onNext={() => setMonth((m) => addMonths(m, 1))}
          onToday={() => setMonth(startOfMonth(new Date()))}
        />
      )}

      {/* 다가오는 일정 */}
      <section className="mt-14">
        <div className="mb-1 flex items-baseline justify-between border-b border-[var(--ink)] pb-2">
          <MonoLabel className="text-[var(--ink-2)]">다가오는 일정</MonoLabel>
          <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length > 0 ? (
          <div>
            {upcoming.map((e) => (
              <UpcomingRow key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <p className="py-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
            예정된 일정이 없습니다
          </p>
        )}
      </section>
    </div>
  );
}
