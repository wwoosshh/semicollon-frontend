"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";

const PANEL_W = 256; // w-64
const MARGIN = 16;

/**
 * Persistent, Discord-style floating voice widget. Rendered INSIDE
 * <LiveKitRoom> (in VoiceProvider), so the LiveKit context hooks are available
 * anywhere in the app while a call is active. Audio-only — no video tiles.
 *
 * Draggable via pointer events on the header handle: the handle captures the
 * pointer, records the grab offset, and updates a fixed `{x,y}` position on
 * move, clamped to the viewport so it can never be dragged off-screen.
 */
export function FloatingVoicePanel({
  channelName,
  onLeave,
}: {
  channelName: string;
  onLeave: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const micOn = localParticipant.isMicrophoneEnabled;

  const panelRef = useRef<HTMLDivElement>(null);
  // null until mounted on the client (SSR guard — no `window` on the server).
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // Default: bottom-left-ish, computed from viewport height on mount (client only).
  useEffect(() => {
    const h = panelRef.current?.offsetHeight ?? 220;
    setPos({ x: MARGIN, y: window.innerHeight - h - MARGIN });
  }, []);

  const clamp = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    const w = el?.offsetWidth ?? PANEL_W;
    const h = el?.offsetHeight ?? 220;
    const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);
    return {
      x: Math.min(Math.max(MARGIN, x), maxX),
      y: Math.min(Math.max(MARGIN, y), maxY),
    };
  }, []);

  // Keep the panel on-screen across viewport resizes.
  useEffect(() => {
    function onResize() {
      setPos((p) => (p ? clamp(p.x, p.y) : p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!pos) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const next = clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy);
      setPos(next);
    },
    [clamp],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      ref={panelRef}
      className="fixed w-64 border border-[var(--ink)] bg-[var(--paper)]"
      style={{
        left: pos?.x ?? MARGIN,
        top: pos?.y ?? MARGIN,
        zIndex: 1000,
        // Hide until positioned to avoid a flash at (MARGIN, MARGIN).
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {/* Drag handle / live header */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-move touch-none select-none items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
      >
        <span className="flex min-w-0 items-center gap-2 font-mono text-[0.8125rem] tracking-[0.02em] text-[var(--ink)]">
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full bg-[var(--accent)]"
          />
          <span className="truncate">음성 · {channelName}</span>
        </span>
        <MonoLabel accent className="shrink-0">
          {participants.length}
        </MonoLabel>
      </div>

      {/* Participant list */}
      <ul className="max-h-48 divide-y divide-[var(--line)] overflow-y-auto px-3">
        {participants.map((p) => (
          <ParticipantRow key={p.identity} p={p} />
        ))}
      </ul>

      {/* Footer controls */}
      <div className="flex items-center gap-2 border-t border-[var(--line)] px-3 py-2.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onLeave}
          className="font-mono text-[0.75rem] tracking-[0.06em]"
        >
          나가기
        </Button>
        <Button
          type="button"
          variant={micOn ? "outline" : "destructive"}
          size="sm"
          onClick={() => localParticipant.setMicrophoneEnabled(!micOn)}
          className="ml-auto font-mono text-[0.75rem] tracking-[0.06em]"
        >
          {micOn ? "음소거" : "마이크"}
        </Button>
      </div>
    </div>
  );
}

function ParticipantRow({ p }: { p: Participant }) {
  const name = p.name || p.identity;
  const speaking = p.isSpeaking;
  const muted = !p.isMicrophoneEnabled;
  return (
    <li className="flex items-center gap-2.5 py-2">
      <span
        aria-hidden
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: speaking ? "var(--accent)" : "var(--line)" }}
      />
      <span className="truncate font-mono text-[0.8125rem] tracking-[0.02em] text-[var(--ink)]">
        {name}
      </span>
      {muted && <MonoLabel className="ml-auto shrink-0">음소거</MonoLabel>}
    </li>
  );
}
