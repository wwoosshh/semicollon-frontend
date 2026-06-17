"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type EventKind,
  EVENT_KINDS,
  createEvent,
  kindColor,
} from "@/lib/events";
import { useMe } from "@/lib/use-me";
import { SectionHeader } from "@/components/ui/section-header";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldCls =
  "w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[0.9375rem] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <MonoLabel as="label" className="mb-2.5 block text-[var(--ink-2)]">
      {children}
    </MonoLabel>
  );
}

/** datetime-local value (`YYYY-MM-DDTHH:mm`) → ISO string. */
function toISO(value: string): string {
  return new Date(value).toISOString();
}

export default function NewCalendarEventPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("정기모임");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        // spaceId omitted → global (전체) event.
        title,
        kind,
        startsAt: toISO(startsAt),
        endsAt: endsAt ? toISO(endsAt) : null,
        location,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      router.push("/calendar");
    },
  });

  const isAdmin = me?.role === "운영진";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || mutation.isPending) return;
    mutation.mutate();
  }

  return (
    <div>
      <SectionHeader number="05" title="일정 추가" />

      {!isAdmin ? (
        <div className="border border-[var(--line)] px-6 py-16 text-center">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
            운영진만 전체 일정을 추가할 수 있습니다
          </p>
          <Link
            href="/calendar"
            className="mt-4 inline-block font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
          >
            ← 캘린더
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="max-w-2xl">
          {/* TITLE */}
          <div className="mb-8">
            <FieldLabel>TITLE</FieldLabel>
            <input
              className={fieldCls}
              type="text"
              value={title}
              maxLength={120}
              placeholder="일정 제목을 입력하세요"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* KIND — segmented mono toggles */}
          <div className="mb-8">
            <FieldLabel>KIND</FieldLabel>
            <div className="flex flex-wrap gap-px border border-[var(--line)] bg-[var(--line)]">
              {EVENT_KINDS.map((k) => {
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors",
                      on
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2"
                      style={{
                        background: on ? "var(--paper)" : kindColor(k),
                      }}
                    />
                    {k}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STARTS AT */}
          <div className="mb-8">
            <FieldLabel>STARTS AT</FieldLabel>
            <input
              className={fieldCls}
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>

          {/* ENDS AT (optional) */}
          <div className="mb-8">
            <FieldLabel>ENDS AT (선택)</FieldLabel>
            <input
              className={fieldCls}
              type="datetime-local"
              value={endsAt}
              min={startsAt || undefined}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>

          {/* LOCATION */}
          <div className="mb-8">
            <FieldLabel>LOCATION</FieldLabel>
            <input
              className={fieldCls}
              type="text"
              value={location}
              maxLength={120}
              placeholder="장소 (예: 공학관 301)"
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="mb-4 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--accent)]">
              {(mutation.error as Error).message}
            </p>
          )}

          <div className="flex items-center gap-5 border-t border-[var(--line)] pt-6">
            <Button
              type="submit"
              disabled={!title.trim() || !startsAt || mutation.isPending}
              className="font-mono text-[0.8125rem] tracking-[0.06em]"
            >
              {mutation.isPending ? "등록 중…" : "등록 →"}
            </Button>
            <Link
              href="/calendar"
              className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            >
              취소
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
