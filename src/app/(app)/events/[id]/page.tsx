"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AttendanceStatus,
  type AttendanceRow,
  type EventDetail,
  ATTENDANCE_STATUSES,
  getEvent,
  deleteEvent,
  setMyAttendance,
  setMemberAttendance,
  kindColor,
  formatTime,
} from "@/lib/events";
import { formatDate } from "@/lib/content";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shared 3-way 출석/지각/결석 toggle. 출석 selected = accent, others = ink. */
function StatusToggle({
  value,
  onChange,
  disabled,
  size = "default",
}: {
  value: AttendanceStatus | null;
  onChange: (s: AttendanceStatus) => void;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  return (
    <div className="inline-flex gap-px border border-[var(--line)] bg-[var(--line)]">
      {ATTENDANCE_STATUSES.map((s) => {
        const on = value === s;
        const accent = on && s === "출석";
        return (
          <button
            key={s}
            type="button"
            onClick={() => !on && onChange(s)}
            disabled={disabled}
            aria-pressed={on}
            className={cn(
              "font-mono uppercase tracking-[0.08em] transition-colors disabled:opacity-50",
              size === "sm" ? "px-2.5 py-1.5 text-[0.6875rem]" : "px-4 py-2.5 text-[0.8125rem]",
              accent
                ? "bg-[var(--accent)] text-[var(--paper)]"
                : on
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function MemberRow({
  row,
  eventId,
}: {
  row: AttendanceRow;
  eventId: string;
}) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (status: AttendanceStatus) =>
      setMemberAttendance(eventId, row.user_id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", eventId] }),
  });
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3">
      <span className="text-sm text-[var(--ink)]">
        {row.name || <span className="text-[var(--muted-ink)]">(이름 없음)</span>}
      </span>
      <StatusToggle
        value={row.status}
        onChange={(s) => m.mutate(s)}
        disabled={m.isPending}
        size="sm"
      />
    </li>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();

  const { data: ev, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ["event", id],
    queryFn: () => getEvent(id),
    enabled: !!id,
  });

  const myM = useMutation({
    mutationFn: (status: AttendanceStatus) => setMyAttendance(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", id] }),
  });

  const deleteM = useMutation({
    mutationFn: () => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      router.push("/calendar");
    },
  });

  if (isLoading) {
    return (
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        LOADING…
      </p>
    );
  }

  if (isError || !ev) {
    return (
      <div className="border border-[var(--line)] px-6 py-16 text-center">
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          일정을 찾을 수 없습니다
        </p>
        <Link
          href="/calendar"
          className="mt-4 inline-block font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          ← 캘린더
        </Link>
      </div>
    );
  }

  const dateLine =
    formatDate(ev.starts_at) +
    " " +
    formatTime(ev.starts_at) +
    (ev.ends_at ? ` – ${formatTime(ev.ends_at)}` : "");

  return (
    <div className="max-w-3xl">
      <Link
        href="/calendar"
        className="mb-8 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
      >
        ← 캘린더
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5"
          style={{ background: kindColor(ev.kind) }}
        />
        <MonoLabel
          className={ev.kind === "마감" ? "text-[var(--accent)]" : undefined}
        >
          {ev.kind}
        </MonoLabel>
      </div>
      <h1 className="font-serif text-3xl font-black leading-[1.2] tracking-tight text-[var(--ink)] sm:text-4xl">
        {ev.title}
      </h1>

      {/* Meta block */}
      <div className="mt-6 border-t border-[var(--ink)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] py-3">
          <MonoLabel>날짜·시간</MonoLabel>
          <span className="font-mono text-[0.8125rem] tracking-[0.04em] text-[var(--ink)]">
            {dateLine}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--line)] py-3">
          <MonoLabel>LOCATION</MonoLabel>
          <span className="text-sm text-[var(--ink)]">
            {ev.location || <span className="text-[var(--muted-ink)]">—</span>}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <MonoLabel>SCOPE</MonoLabel>
          {ev.space_id ? (
            <Link
              href={`/spaces/${ev.space_id}`}
              className="border border-[var(--line)] px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
            >
              {ev.space_title || "활동공간"}
            </Link>
          ) : (
            <span className="border border-[var(--line)] px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--accent)]">
              전체
            </span>
          )}
        </div>
      </div>

      {/* 내 출석 */}
      <section className="mt-12">
        <MonoLabel className="mb-3 block text-[var(--ink-2)]">내 출석</MonoLabel>
        <StatusToggle
          value={ev.myStatus}
          onChange={(s) => myM.mutate(s)}
          disabled={myM.isPending}
        />
        {myM.isError && (
          <p className="mt-2 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
            {(myM.error as Error).message}
          </p>
        )}
      </section>

      {/* 출석 현황 */}
      <section className="mt-10">
        <MonoLabel className="mb-3 block text-[var(--ink-2)]">출석 현황</MonoLabel>
        <p className="font-mono text-[0.8125rem] tracking-[0.06em] text-[var(--ink)]">
          출석 {ev.counts.출석}
          <span className="px-2 text-[var(--muted-ink)]">·</span>
          지각 {ev.counts.지각}
          <span className="px-2 text-[var(--muted-ink)]">·</span>
          결석 {ev.counts.결석}
        </p>
      </section>

      {/* Member attendance table (manager only) */}
      {ev.canManage && (
        <section className="mt-12">
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--ink)] pb-2">
            <MonoLabel className="text-[var(--ink-2)]">출석 관리</MonoLabel>
            <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
              {ev.attendance.length}
            </span>
          </div>
          {ev.attendance.length > 0 ? (
            <ul>
              {ev.attendance.map((row) => (
                <MemberRow key={row.user_id} row={row} eventId={id} />
              ))}
            </ul>
          ) : (
            <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              아직 출석 기록이 없습니다
            </p>
          )}
        </section>
      )}

      {/* Delete (manager only) */}
      {ev.canManage && (
        <div className="mt-12 border-t border-[var(--line)] pt-5">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteM.mutate()}
            disabled={deleteM.isPending}
            className="font-mono text-[0.75rem] tracking-[0.06em]"
          >
            {deleteM.isPending ? "삭제 중…" : "삭제"}
          </Button>
          {deleteM.isError && (
            <p className="mt-2 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
              {(deleteM.error as Error).message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
