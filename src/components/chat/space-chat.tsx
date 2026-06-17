"use client";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import { useMe } from "@/lib/use-me";
import { formatDate } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  space_id: string;
  created_at: string;
}
interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

/** ISO → `HH:mm` (24h), to pair with the mono editorial date. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function SpaceChat({ spaceId }: { spaceId: string }) {
  const { data: me } = useMe();
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load default channel + recent history.
  useEffect(() => {
    let active = true;
    (async () => {
      const channels = await api<Channel[]>(`/spaces/${spaceId}/channels`);
      if (!active || channels.length === 0) return;
      const cid = channels[0].id;
      setChannelId(cid);
      const hist = await api<ChatMessage[]>(`/channels/${cid}/messages`);
      if (active) setMessages(hist);
    })();
    return () => {
      active = false;
    };
  }, [spaceId]);

  // Connect socket once we have a channel; join + listen for echoes.
  useEffect(() => {
    if (!channelId) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: authStore.access },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { channelId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (msg: ChatMessage) => {
      if (msg.channel_id === channelId) setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [channelId]);

  // Auto-scroll to newest.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !channelId || !socketRef.current) return;
    socketRef.current.emit("message", { channelId, body });
    setText("");
  }

  const canSend = connected && text.trim().length > 0;

  return (
    <section>
      {/* Connection indicator */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          채팅 · 메인
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em]",
            connected ? "text-[var(--accent)]" : "text-[var(--muted-ink)]",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              connected ? "bg-[var(--accent)]" : "bg-[var(--muted-ink)]",
            )}
          />
          {connected ? "연결됨" : "연결 중…"}
        </span>
      </div>

      {/* Message area */}
      <div className="h-[60vh] overflow-y-auto border-t border-[var(--line)] py-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
            아직 메시지가 없습니다 — 첫 메시지를 보내보세요
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg, i) => {
              const mine = !!me && msg.author_id === me.id;
              const prev = messages[i - 1];
              const grouped = !!prev && prev.author_id === msg.author_id;
              return (
                <li key={msg.id} className={cn(grouped && "!mt-0.5")}>
                  {!grouped && (
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-mono text-[0.75rem] uppercase tracking-[0.08em]",
                          mine
                            ? "text-[var(--accent)]"
                            : "text-[var(--ink)]",
                        )}
                      >
                        {msg.author_name}
                      </span>
                      <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-[var(--muted-ink)]">
                        {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <p className="mt-0.5 break-words whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--ink)]">
                    {msg.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-4"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요…"
          className="h-9 w-full rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)] focus-visible:border-[var(--ink)]"
        />
        <Button
          type="submit"
          disabled={!canSend}
          className="h-9 shrink-0 font-mono text-[0.8125rem] tracking-[0.06em]"
        >
          전송 →
        </Button>
      </form>
    </section>
  );
}
