"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChannelChat } from "@/components/chat/channel-chat";

interface Channel {
  id: string;
  name: string;
  space_id: string;
  created_at: string;
}

/**
 * Resolves the space's main channel (first channel) and renders the
 * reusable ChannelChat against it. Preserves the existing 채팅 tab behavior.
 */
export function SpaceChat({ spaceId }: { spaceId: string }) {
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setChannelId(null);
    (async () => {
      const channels = await api<Channel[]>(`/spaces/${spaceId}/channels`);
      if (active && channels.length > 0) setChannelId(channels[0].id);
    })();
    return () => {
      active = false;
    };
  }, [spaceId]);

  if (!channelId) {
    return (
      <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        LOADING…
      </p>
    );
  }

  return <ChannelChat channelId={channelId} />;
}
