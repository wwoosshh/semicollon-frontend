"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type PostDetail,
  getPost,
  deletePost,
  addComment,
  formatDate,
} from "@/lib/content";
import { useMe } from "@/lib/use-me";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldCls =
  "w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[0.9375rem] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)]";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const [comment, setComment] = useState("");

  const { data: post, isLoading, isError } = useQuery<PostDetail>({
    queryKey: ["post", id],
    queryFn: () => getPost(id),
    enabled: !!id,
  });

  const backHref = post?.space_id ? `/spaces/${post.space_id}` : "/news";

  const commentM = useMutation({
    mutationFn: () => addComment(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", id] });
      setComment("");
    },
  });

  const deleteM = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      router.push(backHref);
    },
  });

  if (isLoading) {
    return (
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        LOADING…
      </p>
    );
  }

  if (isError || !post) {
    return (
      <div className="border border-[var(--line)] px-6 py-16 text-center">
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          글을 찾을 수 없습니다
        </p>
        <Link
          href="/news"
          className="mt-4 inline-block font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          ← 소식
        </Link>
      </div>
    );
  }

  const canDelete = me?.role === "운영진" || me?.id === post.author_id;
  const scopeLabel = post.space_id ? "활동공간" : "전체";

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || commentM.isPending) return;
    commentM.mutate();
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={backHref}
        className="mb-8 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
      >
        ← {post.space_id ? "활동공간" : "소식"}
      </Link>

      <h1 className="font-serif text-3xl font-black leading-[1.2] tracking-tight text-[var(--ink)] sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
        <span>{post.author_name}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(post.created_at)}</span>
        <span aria-hidden>·</span>
        <span
          className={cn(
            "border border-[var(--line)] px-1.5 py-0.5",
            !post.space_id && "text-[var(--accent)]",
          )}
        >
          {scopeLabel}
        </span>
      </div>

      <div className="mt-6 h-px w-full bg-[var(--line)]" />

      <div className="mt-6 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--ink)]">
        {post.body || "—"}
      </div>

      {canDelete && (
        <div className="mt-8 border-t border-[var(--line)] pt-5">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteM.mutate()}
            disabled={deleteM.isPending}
            className="font-mono text-[0.75rem] tracking-[0.06em]"
          >
            {deleteM.isPending ? "삭제 중…" : "글 삭제"}
          </Button>
          {deleteM.isError && (
            <p className="mt-2 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
              {(deleteM.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Comments */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline gap-2 border-b border-[var(--ink)] pb-2">
          <MonoLabel className="text-[var(--ink-2)]">COMMENTS</MonoLabel>
          <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
            ({post.comments.length})
          </span>
        </div>

        {post.comments.length > 0 ? (
          <ul>
            {post.comments.map((c) => (
              <li key={c.id} className="border-b border-[var(--line)] py-4">
                <div className="flex items-baseline gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
                  <span>{c.author_name}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(c.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--ink)]">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
            아직 댓글이 없습니다
          </p>
        )}

        {me ? (
          <form onSubmit={submitComment} className="mt-6">
            <textarea
              className={cn(fieldCls, "min-h-24 resize-y leading-relaxed")}
              value={comment}
              placeholder="댓글을 입력하세요"
              onChange={(e) => setComment(e.target.value)}
            />
            {commentM.isError && (
              <p className="mt-2 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
                {(commentM.error as Error).message}
              </p>
            )}
            <div className="mt-3">
              <Button
                type="submit"
                disabled={!comment.trim() || commentM.isPending}
                className="font-mono text-[0.8125rem] tracking-[0.06em]"
              >
                {commentM.isPending ? "등록 중…" : "댓글 →"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
            로그인 후 댓글을 작성할 수 있습니다
          </p>
        )}
      </section>
    </div>
  );
}
