"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type EventItem,
  type EventKind,
  EVENT_KINDS,
  listEvents,
  createEvent,
  kindColor,
  formatTime,
} from "@/lib/events";
import { formatDate } from "@/lib/content";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldCls =
  "w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[0.9375rem] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <MonoLabel as="label" className="mb-2 block text-[var(--ink-2)]">
      {children}
    </MonoLabel>
  );
}

function toISO(value: string): string {
  return new Date(value).toISOString();
}

function Row({ e }: { e: EventItem }) {
  return (
    <Link
      href={`/events/${e.id}`}
      className="group flex items-center gap-4 border-b border-[var(--line)] py-3 transition-colors hover:bg-[var(--paper-2)]"
    >
      <span className="flex shrink-0 items-baseline gap-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)]">
        <span>{formatDate(e.starts_at)}</span>
        <span className="text-[var(--muted-ink)]">{formatTime(e.starts_at)}</span>
      </span>
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
      <span className="flex-1 truncate font-serif text-[1rem] font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
        {e.title}
      </span>
    </Link>
  );
}

export function SpaceEventList({
  spaceId,
  canCreate,
}: {
  spaceId: string;
  canCreate: boolean;
}) {
  const qc = useQueryClient();
  const key = ["events", spaceId] as const;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("정기모임");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => listEvents(spaceId),
  });

  const createM = useMutation({
    mutationFn: () =>
      createEvent({
        spaceId,
        title,
        kind,
        startsAt: toISO(startsAt),
        endsAt: endsAt ? toISO(endsAt) : null,
        location,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["events"] });
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setLocation("");
      setKind("정기모임");
      setOpen(false);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || createM.isPending) return;
    createM.mutate();
  }

  const events = (data ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  return (
    <div>
      {canCreate && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              "font-mono text-[0.75rem] uppercase tracking-[0.1em] underline-offset-4 transition-colors hover:underline",
              open
                ? "text-[var(--accent)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]",
            )}
          >
            {open ? "− 닫기" : "+ 일정 추가"}
          </button>

          {open && (
            <form
              onSubmit={submit}
              className="mt-4 border-t border-[var(--line)] pt-5"
            >
              <div className="mb-5">
                <FieldLabel>TITLE</FieldLabel>
                <input
                  className={fieldCls}
                  type="text"
                  value={title}
                  maxLength={120}
                  placeholder="일정 제목"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-5">
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
                          "flex items-center gap-1.5 px-3 py-2 font-mono text-[0.75rem] tracking-[0.04em] transition-colors",
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

              <div className="mb-5">
                <FieldLabel>STARTS AT</FieldLabel>
                <input
                  className={fieldCls}
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="mb-5">
                <FieldLabel>ENDS AT (선택)</FieldLabel>
                <input
                  className={fieldCls}
                  type="datetime-local"
                  value={endsAt}
                  min={startsAt || undefined}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>

              <div className="mb-5">
                <FieldLabel>LOCATION</FieldLabel>
                <input
                  className={fieldCls}
                  type="text"
                  value={location}
                  maxLength={120}
                  placeholder="장소"
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {createM.isError && (
                <p className="mb-3 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--accent)]">
                  {(createM.error as Error).message}
                </p>
              )}
              <Button
                type="submit"
                disabled={!title.trim() || !startsAt || createM.isPending}
                className="font-mono text-[0.8125rem] tracking-[0.06em]"
              >
                {createM.isPending ? "등록 중…" : "등록 →"}
              </Button>
            </form>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          LOADING…
        </p>
      ) : isError ? (
        <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          일정을 불러오지 못했습니다
        </p>
      ) : events.length > 0 ? (
        <div className="border-t border-[var(--ink)]">
          {events.map((e) => (
            <Row key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <p className="border-t border-[var(--line)] py-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          아직 일정이 없습니다
        </p>
      )}
    </div>
  );
}
