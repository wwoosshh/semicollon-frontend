"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Me } from "@/lib/use-me";

const cellCls = "px-3 py-3.5 align-middle text-sm text-[var(--ink)]";

function RoleText({ role }: { role: Me["role"] }) {
  if (role === "운영진") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--accent)]">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
        />
        운영진
      </span>
    );
  }
  return <span className="text-[var(--ink-2)]">부원</span>;
}

export function MemberRow({
  member,
  canEdit,
}: {
  member: Me;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [cohort, setCohort] = useState(member.cohort?.toString() ?? "");

  const mutation = useMutation({
    mutationFn: (patch: { role?: Me["role"]; cohort?: number | null }) =>
      api(`/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  if (!canEdit) {
    return (
      <tr className="border-b border-[var(--line)]">
        <td className={cellCls}>
          {member.name || (
            <span className="text-[var(--muted-ink)]">(이름 없음)</span>
          )}
        </td>
        <td className={cellCls}>
          <RoleText role={member.role} />
        </td>
        <td className={cellCls}>
          {member.cohort != null ? (
            <span className="font-mono tracking-[0.04em]">{member.cohort}</span>
          ) : (
            <span className="text-[var(--muted-ink)]">—</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--line)]">
      <td className={cellCls}>
        {member.name || (
          <span className="text-[var(--muted-ink)]">(이름 없음)</span>
        )}
      </td>
      <td className={cellCls}>
        <select
          className="rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
          defaultValue={member.role}
          disabled={mutation.isPending}
          onChange={(e) =>
            mutation.mutate({ role: e.target.value as Me["role"] })
          }
        >
          <option value="부원">부원</option>
          <option value="운영진">운영진</option>
        </select>
      </td>
      <td className={cellCls}>
        <input
          className="w-16 rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-2 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
          type="number"
          value={cohort}
          disabled={mutation.isPending}
          onChange={(e) => setCohort(e.target.value)}
          onBlur={() =>
            mutation.mutate({ cohort: cohort === "" ? null : Number(cohort) })
          }
        />
      </td>
    </tr>
  );
}
