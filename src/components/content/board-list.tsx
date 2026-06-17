"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type PostListItem,
  listPosts,
  createPost,
  formatDate,
} from "@/lib/content";
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

function Row({ p }: { p: PostListItem }) {
  return (
    <li className="border-b border-[var(--line)]">
      <Link
        href={`/posts/${p.id}`}
        className="group flex items-baseline justify-between gap-4 py-4 transition-colors hover:bg-[var(--paper-2)]"
      >
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="truncate font-serif text-[1.0625rem] font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)]">
            {p.title}
          </h3>
          <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
            댓글 {p.comment_count}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
            {p.author_name}
          </span>
          <span className="font-mono text-[0.75rem] tracking-[0.06em] text-[var(--muted-ink)]">
            {formatDate(p.created_at)}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function BoardList({
  spaceId,
  canWrite = true,
}: {
  spaceId?: string;
  canWrite?: boolean;
}) {
  const qc = useQueryClient();
  const key = ["posts", spaceId ?? "전체"] as const;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => listPosts(spaceId),
  });

  const createM = useMutation({
    mutationFn: () => createPost({ spaceId: spaceId ?? null, title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setTitle("");
      setBody("");
      setOpen(false);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || createM.isPending) return;
    createM.mutate();
  }

  return (
    <div>
      <div className="mb-6">
        {!canWrite ? (
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
            참여하면 글을 쓸 수 있습니다
          </p>
        ) : (
          <>
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
          {open ? "− 닫기" : "+ 글쓰기"}
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
                placeholder="글 제목"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mb-5">
              <FieldLabel>BODY</FieldLabel>
              <textarea
                className={cn(fieldCls, "min-h-32 resize-y leading-relaxed")}
                value={body}
                placeholder="내용을 입력하세요"
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
          </>
        )}
      </div>

      {isLoading ? (
        <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          LOADING…
        </p>
      ) : isError ? (
        <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          글을 불러오지 못했습니다
        </p>
      ) : data && data.length > 0 ? (
        <ul className="border-t border-[var(--ink)]">
          {data.map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </ul>
      ) : (
        <p className="border-t border-[var(--line)] py-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          아직 글이 없습니다
        </p>
      )}
    </div>
  );
}
