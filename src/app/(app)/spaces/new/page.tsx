"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  type SpaceDetail,
  type SpaceType,
  SPACE_TYPES,
  typeEn,
} from "@/lib/spaces";
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

export default function NewSpacePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = useState<SpaceType>("프로젝트");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api<SpaceDetail>("/spaces", {
        method: "POST",
        body: JSON.stringify({ type, title, description }),
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      router.push(`/spaces/${created.id}`);
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || mutation.isPending) return;
    mutation.mutate();
  }

  return (
    <div>
      <SectionHeader number="03" title="활동 제안" />

      <form onSubmit={onSubmit} className="max-w-2xl">
        {/* TYPE — segmented mono toggle row */}
        <div className="mb-8">
          <FieldLabel>TYPE</FieldLabel>
          <div className="flex flex-wrap gap-px border border-[var(--line)] bg-[var(--line)]">
            {SPACE_TYPES.map((t) => {
              const on = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  aria-pressed={on}
                  className={cn(
                    "flex-1 px-4 py-3 text-center transition-colors",
                    on
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
                  )}
                >
                  <span className="block text-[0.9375rem] font-medium">
                    {t}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.12em]",
                      on ? "text-[var(--paper)]/70" : "text-[var(--muted-ink)]",
                    )}
                  >
                    {typeEn(t)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TITLE */}
        <div className="mb-8">
          <FieldLabel>TITLE</FieldLabel>
          <input
            className={fieldCls}
            type="text"
            value={title}
            maxLength={120}
            placeholder="활동의 제목을 입력하세요"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-8">
          <FieldLabel>DESCRIPTION</FieldLabel>
          <textarea
            className={cn(fieldCls, "min-h-40 resize-y leading-relaxed")}
            value={description}
            placeholder="무엇을 하려는 활동인지 설명해주세요"
            onChange={(e) => setDescription(e.target.value)}
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
            disabled={!title.trim() || mutation.isPending}
            className="font-mono text-[0.8125rem] tracking-[0.06em]"
          >
            {mutation.isPending ? "제안 중…" : "제안하기 →"}
          </Button>
          <Link
            href="/spaces"
            className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
