"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { api } from "@/lib/api";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";

interface VoiceConn {
  token: string;
  url: string;
}

/**
 * Editorial-styled LiveKit voice channel. Audio-only: no video tiles.
 *
 * LiveKit client code only executes after the user clicks 음성 입장 (in the
 * click handler and, once `joined`, in the LiveKitRoom subtree). The module is
 * `"use client"`, so nothing here runs at SSR/import time — the headless hooks
 * (`useParticipants` / `useLocalParticipant`) only mount inside <LiveKitRoom>.
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
  const [conn, setConn] = useState<VoiceConn | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
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

  async function join() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<VoiceConn>(`/channels/${channelId}/voice-token`, {
        method: "POST",
      });
      setConn(data);
      setJoined(true);
    } catch (e) {
      setError((e as Error).message || "음성 입장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  // ── Lobby (not joined) ───────────────────────────────────────────────────
  if (!joined || !conn) {
    return (
      <div className="border-t border-[var(--line)] py-10">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-baseline gap-1.5 font-mono text-[0.9375rem] tracking-[0.02em] text-[var(--ink)]">
            <span aria-hidden className="text-[var(--muted-ink)]">
              #
            </span>
            {channelName}
          </h3>
          <MonoLabel>VOICE</MonoLabel>
        </div>
        <p className="mt-2 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--ink-2)]">
          음성 채널입니다. 입장하면 마이크로 대화할 수 있습니다.
        </p>
        <div className="mt-5">
          <Button
            type="button"
            onClick={join}
            disabled={loading}
            className="font-mono text-[0.8125rem] tracking-[0.06em]"
          >
            {loading ? "입장 중…" : "음성 입장 →"}
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

  // ── Connected ────────────────────────────────────────────────────────────
  function leave() {
    setJoined(false);
    setConn(null);
  }

  return (
    <LiveKitRoom
      serverUrl={conn.url}
      token={conn.token}
      connect
      audio
      video={false}
      onDisconnected={leave}
      onError={(e) => {
        setError(e.message || "음성 연결 오류");
        setJoined(false);
        setConn(null);
      }}
    >
      <RoomAudioRenderer />
      <VoicePanel channelName={channelName} onLeave={leave} />
    </LiveKitRoom>
  );
}

/**
 * Inner panel — runs inside <LiveKitRoom>, so the LiveKit context hooks are
 * available. Audio-only, editorial: hairline panel, mono labels, accent only
 * for live/speaking state.
 */
function VoicePanel({
  channelName,
  onLeave,
}: {
  channelName: string;
  onLeave: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const micOn = localParticipant.isMicrophoneEnabled;

  return (
    <div className="border-t border-[var(--ink)] pt-4">
      {/* Live header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <span className="flex items-center gap-2 font-mono text-[0.875rem] tracking-[0.04em] text-[var(--ink)]">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full bg-[var(--accent)]"
          />
          음성 · {channelName}
        </span>
        <MonoLabel accent>{participants.length} 참가자</MonoLabel>
      </div>

      {/* Participant list */}
      <ul className="divide-y divide-[var(--line)]">
        {participants.map((p) => (
          <ParticipantRow key={p.identity} p={p} />
        ))}
      </ul>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <Button
          type="button"
          variant={micOn ? "outline" : "destructive"}
          size="sm"
          onClick={() => localParticipant.setMicrophoneEnabled(!micOn)}
          className="font-mono text-[0.75rem] tracking-[0.06em]"
        >
          {micOn ? "마이크 음소거" : "마이크 해제"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onLeave}
          className="font-mono text-[0.75rem] tracking-[0.06em]"
        >
          나가기
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
    <li className="flex items-center gap-2.5 py-2.5">
      <span
        aria-hidden
        className="inline-block size-2 shrink-0 rounded-full"
        style={{
          backgroundColor: speaking ? "var(--accent)" : "var(--line)",
        }}
      />
      <span className="truncate font-mono text-[0.8125rem] tracking-[0.02em] text-[var(--ink)]">
        {name}
      </span>
      {muted && (
        <MonoLabel className="ml-auto shrink-0">음소거</MonoLabel>
      )}
    </li>
  );
}
