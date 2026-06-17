"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MonoLabel } from "@/components/ui/mono-label";
import { Button } from "@/components/ui/button";

export function InviteCodePanel() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const { data } = useQuery({
    queryKey: ["inviteCode"],
    queryFn: () => api<{ code: string }>("/settings/invite-code"),
  });

  useEffect(() => {
    if (data?.code) setCode(data.code);
  }, [data?.code]);

  const mutation = useMutation({
    mutationFn: (next: string) =>
      api<{ code: string }>("/settings/invite-code", {
        method: "PUT",
        body: JSON.stringify({ code: next }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["inviteCode"] });
      setCode(res.code);
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 2000);
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmed(false);
    mutation.mutate(code);
  }

  return (
    <div className="mb-8 rounded-[2px] border border-[var(--line)] bg-[var(--paper-2)] p-5">
      <div className="flex items-baseline justify-between gap-4">
        <MonoLabel>초대코드 / INVITE CODE</MonoLabel>
        {confirmed && <MonoLabel accent>변경됨</MonoLabel>}
      </div>
      <p className="mt-2 font-mono text-xl font-medium tracking-[0.06em] text-[var(--ink)]">
        {data?.code ?? "—"}
      </p>
      <div className="mt-4 h-px w-full bg-[var(--line)]" />
      <form onSubmit={onSubmit} className="mt-4 flex items-stretch gap-2">
        <input
          className="min-w-0 flex-1 rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
          value={code}
          required
          placeholder="새 초대코드"
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "변경 중…" : "변경"}
        </Button>
      </form>
    </div>
  );
}
