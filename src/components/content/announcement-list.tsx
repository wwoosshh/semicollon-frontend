"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Announcement,
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  formatDate,
} from "@/lib/content";
import { useMe } from "@/lib/use-me";
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

function Row({
  a,
  onDelete,
  deleting,
}: {
  a: Announcement;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <li className="border-b border-[var(--line)] py-4">
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--muted-ink)]">
          {formatDate(a.created_at)}
        </span>
        <h3 className="font-serif text-[1.0625rem] font-bold leading-snug text-[var(--ink)]">
          {a.title}
        </h3>
      </div>
      {a.body && (
        <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--ink-2)]">
          {a.body}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
          {a.author_name}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            삭제
          </button>
        )}
      </div>
    </li>
  );
}

export function AnnouncementList({
  spaceId,
  canPost,
}: {
  spaceId?: string;
  canPost: boolean;
}) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const key = ["announcements", spaceId ?? "전체"] as const;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => listAnnouncements(spaceId),
  });

  const createM = useMutation({
    mutationFn: () =>
      createAnnouncement({ spaceId: spaceId ?? null, title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setTitle("");
      setBody("");
      setOpen(false);
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || createM.isPending) return;
    createM.mutate();
  }

  function canDelete(a: Announcement) {
    return me?.role === "운영진" || me?.name === a.author_name;
  }

  return (
    <div>
      {canPost && (
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
            {open ? "− 닫기" : "+ 공지 작성"}
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
                  placeholder="공지 제목"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="mb-5">
                <FieldLabel>BODY</FieldLabel>
                <textarea
                  className={cn(fieldCls, "min-h-32 resize-y leading-relaxed")}
                  value={body}
                  placeholder="공지 내용"
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              {createM.isError && (
                <p className="mb-3 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--accent)]">
                  {(createM.error as Error).message}
                </p>
              )}
              <Button
                type="submit"
                disabled={!title.trim() || createM.isPending}
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
          공지를 불러오지 못했습니다
        </p>
      ) : data && data.length > 0 ? (
        <ul className="border-t border-[var(--ink)]">
          {data.map((a) => (
            <Row
              key={a.id}
              a={a}
              onDelete={
                canDelete(a) ? () => deleteM.mutate(a.id) : undefined
              }
              deleting={deleteM.isPending}
            />
          ))}
        </ul>
      ) : (
        <p className="border-t border-[var(--line)] py-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          아직 공지가 없습니다
        </p>
      )}
    </div>
  );
}
