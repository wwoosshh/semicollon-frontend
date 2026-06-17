"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";
import { ChannelChat } from "@/components/chat/channel-chat";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  category: string;
  type: string;
  position: number;
  space_id: string;
  created_at: string;
}

/** Group channels by category, preserving the server-provided ordering. */
function groupByCategory(channels: Channel[]): [string, Channel[]][] {
  const order: string[] = [];
  const map = new Map<string, Channel[]>();
  for (const ch of channels) {
    const cat = ch.category || "일반";
    if (!map.has(cat)) {
      map.set(cat, []);
      order.push(cat);
    }
    map.get(cat)!.push(ch);
  }
  return order.map((cat) => [cat, map.get(cat)!]);
}

/**
 * Discord-style channel system for a space. Renders a category-grouped
 * channel sidebar on the left and the reusable ChannelChat on the right.
 * Leaders / 운영진 (canManage) may create, rename and delete channels.
 */
export function SpaceChannels({
  spaceId,
  canSend,
  canManage,
}: {
  spaceId: string;
  canSend: boolean;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["channels", spaceId], [spaceId]);

  const {
    data: channels,
    isLoading,
    isError,
  } = useQuery<Channel[]>({
    queryKey,
    queryFn: () => api<Channel[]>(`/spaces/${spaceId}/channels`),
    enabled: !!spaceId,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to the first channel once loaded; keep selection valid if the
  // list changes (e.g. after a delete).
  useEffect(() => {
    if (!channels || channels.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) =>
      prev && channels.some((c) => c.id === prev) ? prev : channels[0].id,
    );
  }, [channels]);

  const grouped = useMemo(
    () => (channels ? groupByCategory(channels) : []),
    [channels],
  );
  const selected = channels?.find((c) => c.id === selectedId) ?? null;

  // ── Create ────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("일반");

  const createM = useMutation({
    mutationFn: (vars: { name: string; category: string }) =>
      api<Channel>(`/spaces/${spaceId}/channels`, {
        method: "POST",
        body: JSON.stringify({
          name: vars.name,
          category: vars.category,
          type: "text",
        }),
      }),
    onSuccess: (ch) => {
      qc.invalidateQueries({ queryKey });
      setSelectedId(ch.id);
      setShowCreate(false);
      setNewName("");
      setNewCategory("일반");
    },
  });

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createM.mutate({ name, category: newCategory.trim() || "일반" });
  }

  // ── Rename / Delete ───────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Reset the per-channel settings affordances whenever the selection moves.
  useEffect(() => {
    setShowSettings(false);
    setRenaming(false);
  }, [selectedId]);

  const renameM = useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      api<Channel>(`/channels/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: vars.name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setRenaming(false);
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api(`/channels/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      const remaining = (channels ?? []).filter((c) => c.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
      setShowSettings(false);
      qc.invalidateQueries({ queryKey });
    },
  });

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const name = renameValue.trim();
    if (!name || name === selected.name) {
      setRenaming(false);
      return;
    }
    renameM.mutate({ id: selected.id, name });
  }

  // ── States ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        LOADING…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        채널을 불러올 수 없습니다
      </p>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        아직 채널이 없습니다
      </p>
    );
  }

  // ── Sidebar (shared between desktop column + mobile collapsible) ───────
  const channelRows = grouped.map(([category, list]) => (
    <div key={category} className="mb-4">
      <MonoLabel className="mb-1.5 block px-3">{category}</MonoLabel>
      <ul>
        {list.map((ch) => {
          const on = ch.id === selectedId;
          return (
            <li key={ch.id}>
              <button
                type="button"
                onClick={() => setSelectedId(ch.id)}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-1.5 border-l-2 py-1.5 pr-3 pl-[calc(0.75rem-2px)] text-left font-mono text-[0.8125rem] tracking-[0.02em] transition-colors",
                  on
                    ? "border-[var(--accent)] bg-[var(--paper-2)] text-[var(--accent)]"
                    : "border-transparent text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]",
                )}
              >
                <span aria-hidden className="text-[var(--muted-ink)]">
                  #
                </span>
                <span className="truncate">{ch.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ));

  const createAffordance = canManage && (
    <div className="px-3 pt-2">
      {showCreate ? (
        <form onSubmit={submitCreate} className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="채널 이름"
            autoFocus
            className="h-8 w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 font-mono text-[0.8125rem] text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)] focus-visible:border-[var(--ink)]"
          />
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="카테고리"
            className="h-8 w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 font-mono text-[0.8125rem] text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)] focus-visible:border-[var(--ink)]"
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={createM.isPending || !newName.trim()}
              className="font-mono text-[0.75rem] tracking-[0.06em]"
            >
              {createM.isPending ? "추가 중…" : "추가 →"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
              className="font-mono text-[0.75rem] tracking-[0.06em]"
            >
              취소
            </Button>
          </div>
          {createM.error && (
            <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
              {(createM.error as Error).message}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setNewCategory(selected?.category || "일반");
          }}
          className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--muted-ink)] transition-colors hover:text-[var(--accent)]"
        >
          + 채널
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile: channel dropdown + create toggle */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-9 w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 font-mono text-[0.8125rem] text-[var(--ink)] outline-none focus-visible:border-[var(--ink)]"
          >
            {grouped.map(([category, list]) => (
              <optgroup key={category} label={category}>
                {list.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    # {ch.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {canManage && <div className="mt-2 -mx-3">{createAffordance}</div>}
      </div>

      {/* Desktop: 2-column grid with a hairline seam */}
      <div className="md:grid md:grid-cols-[14rem_1fr]">
        {/* LEFT sidebar */}
        <aside className="hidden md:block md:border-r md:border-[var(--line)] md:pr-4">
          <div className="border-t border-[var(--ink)] pt-4">{channelRows}</div>
          {createAffordance}
        </aside>

        {/* RIGHT pane */}
        <section className="md:pl-6">
          {selected ? (
            <>
              {/* Channel header */}
              <div className="mb-3 flex items-start justify-between gap-3 border-t border-[var(--ink)] pt-4 md:border-t-0 md:pt-0">
                {renaming ? (
                  <form
                    onSubmit={submitRename}
                    className="flex w-full items-center gap-2"
                  >
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      className="h-8 w-full max-w-xs rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 font-mono text-[0.875rem] text-[var(--ink)] outline-none focus-visible:border-[var(--ink)]"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={renameM.isPending}
                      className="font-mono text-[0.75rem] tracking-[0.06em]"
                    >
                      저장
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRenaming(false)}
                      className="font-mono text-[0.75rem] tracking-[0.06em]"
                    >
                      취소
                    </Button>
                  </form>
                ) : (
                  <h2 className="flex items-baseline gap-1.5 font-mono text-[0.9375rem] tracking-[0.02em] text-[var(--ink)]">
                    <span aria-hidden className="text-[var(--muted-ink)]">
                      #
                    </span>
                    {selected.name}
                  </h2>
                )}

                {canManage && !renaming && (
                  <button
                    type="button"
                    onClick={() => setShowSettings((v) => !v)}
                    aria-expanded={showSettings}
                    aria-label="채널 설정"
                    className={cn(
                      "shrink-0 px-2 font-mono text-base leading-none transition-colors",
                      showSettings
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted-ink)] hover:text-[var(--ink)]",
                    )}
                  >
                    ⋯
                  </button>
                )}
              </div>

              {/* Settings tray: rename + delete */}
              {canManage && showSettings && !renaming && (
                <div className="mb-4 flex flex-wrap items-center gap-3 border-y border-[var(--line)] py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRenameValue(selected.name);
                      setRenaming(true);
                    }}
                    className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                  >
                    이름변경
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `# ${selected.name} 채널을 삭제할까요? 메시지도 함께 삭제됩니다.`,
                        )
                      ) {
                        deleteM.mutate(selected.id);
                      }
                    }}
                    disabled={deleteM.isPending}
                    className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--accent-ink)] transition-colors hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    {deleteM.isPending ? "삭제 중…" : "삭제"}
                  </button>
                  {(renameM.error || deleteM.error) && (
                    <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
                      {((renameM.error || deleteM.error) as Error).message}
                    </p>
                  )}
                </div>
              )}

              {/* Chat */}
              <ChannelChat channelId={selected.id} canSend={canSend} />
            </>
          ) : (
            <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              채널을 선택하세요
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
