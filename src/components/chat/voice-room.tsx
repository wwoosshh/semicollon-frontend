"use client";

import { useState } from "react";
import { useVoice } from "@/components/voice/voice-provider";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";

/**
 * Editorial driver for the GLOBAL voice call. This component no longer holds a
 * <LiveKitRoom> — the connection lives in <VoiceProvider> (in the (app) layout)
 * so it persists across navigation. Here we just read/drive the global state.
 *
 * Joining while another call is active moves you to this channel (Discord-style)
 * — the provider remounts the room on the new channel id.
 */
export function VoiceRoom({
  channelId,
  channelName,
  canJoin,
}: {
  channelId: string;
  channelName: string;
  canJoin: boolean;
}) {
  const { active, connecting, join, leave } = useVoice();
  const isActive = active?.id === channelId;
  const [error, setError] = useState<string | null>(null);

  // ── Members-only gate ────────────────────────────────────────────────────
  if (!canJoin) {
    return (
      <div className="border-t border-[var(--line)] py-12 text-center">
        <MonoLabel className="block">MEMBERS ONLY</MonoLabel>
        <p className="mt-3 font-mono text-[0.8125rem] tracking-[0.02em] text-[var(--ink-2)]">
          참여하면 음성 채널에 입장할 수 있습니다
        </p>
      </div>
    );
  }

  // ── Already in this channel's call ───────────────────────────────────────
  if (isActive) {
    return (
      <div className="border-t border-[var(--ink)] py-10">
        <p className="flex items-center gap-2 font-mono text-[0.875rem] tracking-[0.02em] text-[var(--ink)]">
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full bg-[var(--accent)]"
          />
          이 채널에서 통화 중 — 화면의 음성 패널에서 조작/이동할 수 있습니다
        </p>
        <div className="mt-5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={leave}
            className="font-mono text-[0.8125rem] tracking-[0.06em]"
          >
            나가기
          </Button>
        </div>
      </div>
    );
  }

  // ── Lobby ────────────────────────────────────────────────────────────────
  async function handleJoin() {
    setError(null);
    try {
      await join({ id: channelId, name: channelName });
    } catch (e) {
      setError((e as Error).message || "음성 입장에 실패했습니다");
    }
  }

  return (
    <div className="border-t border-[var(--line)] py-10">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-baseline gap-1.5 font-mono text-[0.9375rem] tracking-[0.02em] text-[var(--ink)]">
          <span aria-hidden className="text-[var(--muted-ink)]">
            ♪
          </span>
          {channelName} · 음성 채널
        </h3>
        <MonoLabel>VOICE</MonoLabel>
      </div>
      <p className="mt-2 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--ink-2)]">
        입장하면 페이지를 이동해도 통화가 유지됩니다. 화면의 음성 패널에서 조작하세요.
      </p>
      <div className="mt-5">
        <Button
          type="button"
          onClick={handleJoin}
          disabled={connecting}
          className="font-mono text-[0.8125rem] tracking-[0.06em]"
        >
          {connecting ? "입장 중…" : "음성 입장 →"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
          {error}
        </p>
      )}
    </div>
  );
}
