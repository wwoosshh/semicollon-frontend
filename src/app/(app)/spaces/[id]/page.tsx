"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import {
  type SpaceDetail,
  type SpaceMember,
  type SpaceStatus,
  SPACE_STATUSES,
  statusColor,
  typeEn,
} from "@/lib/spaces";
import { MonoLabel } from "@/components/ui/mono-label";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import { AnnouncementList } from "@/components/content/announcement-list";
import { BoardList } from "@/components/content/board-list";
import { SpaceEventList } from "@/components/calendar/space-event-list";
import { cn } from "@/lib/utils";

type Tab = "개요" | "공지" | "게시판" | "일정";
const TABS: readonly Tab[] = ["개요", "공지", "게시판", "일정"];

function InfoRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        !last && "border-b border-[var(--line)]",
      )}
    >
      <MonoLabel>{label}</MonoLabel>
      <span className="text-sm text-[var(--ink)]">{children}</span>
    </div>
  );
}

function MemberItem({ member }: { member: SpaceMember }) {
  const lead = member.role === "리더";
  return (
    <li className="flex items-center justify-between border-b border-[var(--line)] py-3">
      <span className="text-sm text-[var(--ink)]">
        {member.name || (
          <span className="text-[var(--muted-ink)]">(이름 없음)</span>
        )}
      </span>
      {lead ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
          />
          리더
        </span>
      ) : (
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          멤버
        </span>
      )}
    </li>
  );
}

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [tab, setTab] = useState<Tab>("개요");

  const {
    data: space,
    isLoading,
    isError,
  } = useQuery<SpaceDetail>({
    queryKey: ["space", id],
    queryFn: () => api<SpaceDetail>(`/spaces/${id}`),
    enabled: !!id,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["space", id] });
    qc.invalidateQueries({ queryKey: ["spaces"] });
  }

  const joinM = useMutation({
    mutationFn: () => api(`/spaces/${id}/join`, { method: "POST" }),
    onSuccess: invalidate,
  });
  const leaveM = useMutation({
    mutationFn: () => api(`/spaces/${id}/leave`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  const statusM = useMutation({
    mutationFn: (status: SpaceStatus) =>
      api<SpaceDetail>(`/spaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        LOADING…
      </p>
    );
  }

  if (isError || !space) {
    return (
      <div className="border border-[var(--line)] px-6 py-16 text-center">
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          활동공간을 찾을 수 없습니다
        </p>
        <Link
          href="/spaces"
          className="mt-4 inline-block font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          ← 목록으로
        </Link>
      </div>
    );
  }

  const canManage = space.myRole === "리더" || me?.role === "운영진";
  const canPostAnnouncement = space.myRole === "리더" || me?.role === "운영진";
  const isMember = space.myRole !== null;
  const actionError = joinM.error || leaveM.error || statusM.error;

  const action = isMember ? (
    <Button
      variant="outline"
      onClick={() => leaveM.mutate()}
      disabled={leaveM.isPending}
      className="w-full font-mono text-[0.8125rem] tracking-[0.06em]"
    >
      {leaveM.isPending ? "나가는 중…" : "나가기"}
    </Button>
  ) : (
    <Button
      onClick={() => joinM.mutate()}
      disabled={joinM.isPending}
      className="w-full font-mono text-[0.8125rem] tracking-[0.06em]"
    >
      {joinM.isPending ? "참여 중…" : "참여하기 →"}
    </Button>
  );

  return (
    <div>
      <Link
        href="/spaces"
        className="mb-8 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
      >
        ← 활동공간
      </Link>

      {/* Always-visible header */}
      <div className="mb-4 flex items-center gap-4">
        <MonoLabel accent>{typeEn(space.type)}</MonoLabel>
        <StatusDot color={statusColor(space.status)}>{space.status}</StatusDot>
      </div>
      <h1 className="font-serif text-3xl font-black leading-[1.2] tracking-tight text-[var(--ink)] sm:text-4xl">
        {space.title}
      </h1>

      {/* Tab row */}
      <div className="mt-6 flex items-center gap-6 border-b border-[var(--line)]">
        {TABS.map((t) => {
          const on = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={on ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 pb-2.5 font-mono text-[0.8125rem] tracking-[0.06em] transition-colors",
                on
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === "개요" && (
          <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
            {/* Main column */}
            <div>
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--ink-2)]">
                {space.description || "—"}
              </p>

              {/* Members */}
              <section className="mt-12">
                <div className="mb-3 flex items-baseline justify-between border-b border-[var(--ink)] pb-2">
                  <MonoLabel className="text-[var(--ink-2)]">MEMBERS</MonoLabel>
                  <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
                    {space.members.length}
                  </span>
                </div>
                {space.members.length > 0 ? (
                  <ul>
                    {space.members.map((m) => (
                      <MemberItem key={m.user_id} member={m} />
                    ))}
                  </ul>
                ) : (
                  <p className="py-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                    아직 멤버가 없습니다
                  </p>
                )}
              </section>

              {/* Status control (leader or 운영진) */}
              {canManage && (
                <section className="mt-12">
                  <MonoLabel className="mb-3 block text-[var(--ink-2)]">
                    STATUS 변경
                  </MonoLabel>
                  <div className="flex flex-wrap gap-px border border-[var(--line)] bg-[var(--line)]">
                    {SPACE_STATUSES.map((s) => {
                      const on = space.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => !on && statusM.mutate(s)}
                          disabled={statusM.isPending}
                          aria-pressed={on}
                          className={cn(
                            "px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.08em] transition-colors disabled:opacity-50",
                            on
                              ? "bg-[var(--ink)] text-[var(--paper)]"
                              : "bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Right info panel */}
            <aside className="lg:pt-1">
              <div className="border-t border-[var(--ink)]">
                <InfoRow label="STATUS">
                  <StatusDot color={statusColor(space.status)}>
                    {space.status}
                  </StatusDot>
                </InfoRow>
                <InfoRow label="TYPE">{space.type}</InfoRow>
                <InfoRow label="MEMBERS" last>
                  <span className="font-mono tracking-[0.04em]">
                    {space.members.length}명
                  </span>
                </InfoRow>
              </div>

              <div className="mt-6">{action}</div>

              {actionError && (
                <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
                  {(actionError as Error).message}
                </p>
              )}
            </aside>
          </div>
        )}

        {tab === "공지" && (
          <AnnouncementList spaceId={id} canPost={canPostAnnouncement} />
        )}

        {tab === "게시판" && <BoardList spaceId={id} />}

        {tab === "일정" && (
          <SpaceEventList spaceId={id} canCreate={canManage} />
        )}
      </div>
    </div>
  );
}
