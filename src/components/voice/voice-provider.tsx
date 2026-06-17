"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { api } from "@/lib/api";
import { FloatingVoicePanel } from "./floating-voice-panel";

interface ActiveChannel {
  id: string;
  name: string;
}

interface VoiceCtx {
  active: ActiveChannel | null;
  connecting: boolean;
  join: (ch: ActiveChannel) => Promise<void>;
  leave: () => void;
}

const Ctx = createContext<VoiceCtx | null>(null);

export function useVoice(): VoiceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useVoice must be used within VoiceProvider");
  return c;
}

/**
 * Global voice connection holder. Mounted in `(app)/layout.tsx`, which stays
 * mounted across App Router navigation under `(app)/` — so the LiveKit
 * connection persists while the user moves between pages (Discord-style).
 *
 * Switching channels: calling `join` for a new channel replaces token+active;
 * `key={active.id}` remounts <LiveKitRoom> so the old room disconnects and the
 * new one connects — i.e. moving rooms like Discord. Closing the site or
 * logging out unmounts the provider, ending the call.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveChannel | null>(null);
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  const join = useCallback(async (ch: ActiveChannel) => {
    setConnecting(true);
    try {
      const r = await api<{ token: string; url: string }>(
        `/channels/${ch.id}/voice-token`,
        { method: "POST" },
      );
      setConn(r);
      setActive(ch);
    } finally {
      setConnecting(false);
    }
  }, []);

  const leave = useCallback(() => {
    setActive(null);
    setConn(null);
  }, []);

  return (
    <Ctx.Provider value={{ active, connecting, join, leave }}>
      {children}
      {active && conn && (
        <LiveKitRoom
          key={active.id}
          serverUrl={conn.url}
          token={conn.token}
          connect
          audio
          video={false}
          onDisconnected={leave}
          style={{ display: "contents" }}
        >
          <RoomAudioRenderer />
          <FloatingVoicePanel channelName={active.name} onLeave={leave} />
        </LiveKitRoom>
      )}
    </Ctx.Provider>
  );
}
