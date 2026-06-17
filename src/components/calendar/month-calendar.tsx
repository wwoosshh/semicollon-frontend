"use client";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { type EventItem, kindColor } from "@/lib/events";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const MAX_CHIPS = 3;

function buildDays(month: Date): Date[] {
  // First grid cell = the Sunday on/before the 1st; last = Saturday on/after the
  // last day. weekStartsOn: 0 = Sunday, matching the 일~토 header.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }
  // Always render a full 6-row grid (42 cells) so month height never jumps.
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }
  return days;
}

function eventsForDay(events: EventItem[], day: Date): EventItem[] {
  return events
    .filter((e) => isSameDay(new Date(e.starts_at), day))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
}

export function MonthCalendar({
  events,
  month,
  onPrev,
  onNext,
  onToday,
}: {
  events: EventItem[];
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const days = buildDays(month);
  const today = new Date();

  return (
    <div>
      {/* Header: prev/next + month label + 오늘 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            aria-label="이전 달"
            className="flex h-8 w-8 items-center justify-center border border-[var(--line)] font-mono text-[0.9375rem] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="다음 달"
            className="flex h-8 w-8 items-center justify-center border border-[var(--line)] font-mono text-[0.9375rem] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            →
          </button>
          <span className="ml-3 font-mono text-[1.0625rem] tracking-[0.08em] text-[var(--ink)]">
            {format(month, "yyyy.MM")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToday}
          className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
        >
          오늘
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-t border-[var(--line)]">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 6×7 day grid — hairline trick (gap-px over bg-line). */}
      <div className="grid grid-cols-7 gap-px border border-[var(--line)] bg-[var(--line)]">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const dayEvents = eventsForDay(events, day);
          const shown = dayEvents.slice(0, MAX_CHIPS);
          const overflow = dayEvents.length - shown.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[6.5rem] bg-[var(--paper)] p-1.5",
                !inMonth && "bg-[var(--paper-2)]",
              )}
            >
              {/* Day number */}
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "font-mono text-[0.75rem] tracking-[0.04em]",
                    isToday
                      ? "text-[var(--accent)]"
                      : inMonth
                        ? "text-[var(--ink-2)]"
                        : "text-[var(--muted-ink)]",
                  )}
                >
                  {format(day, "d")}
                </span>
                {isToday && (
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                  />
                )}
              </div>

              {/* Event chips */}
              <div className="space-y-0.5">
                {shown.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    title={e.title}
                    className="flex items-center gap-1 px-0.5 py-px transition-colors hover:bg-[var(--paper-2)]"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 shrink-0"
                      style={{ background: kindColor(e.kind) }}
                    />
                    <span className="truncate text-[0.6875rem] leading-tight text-[var(--ink)]">
                      {e.title}
                    </span>
                  </Link>
                ))}
                {overflow > 0 && (
                  <div className="px-0.5 font-mono text-[0.625rem] tracking-[0.06em] text-[var(--muted-ink)]">
                    +{overflow}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
