"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Me } from "@/lib/use-me";

export function MemberRow({ member, canEdit }: { member: Me; canEdit: boolean }) {
  const qc = useQueryClient();
  const [cohort, setCohort] = useState(member.cohort?.toString() ?? "");

  const mutation = useMutation({
    mutationFn: (patch: { role?: Me["role"]; cohort?: number | null }) =>
      api(`/members/${member.id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  if (!canEdit) {
    return (
      <tr className="border-b">
        <td className="p-2">{member.name || "(이름 없음)"}</td>
        <td className="p-2">{member.role}</td>
        <td className="p-2">{member.cohort ?? "-"}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="p-2">{member.name || "(이름 없음)"}</td>
      <td className="p-2">
        <select className="rounded border p-1" defaultValue={member.role}
          disabled={mutation.isPending}
          onChange={(e) => mutation.mutate({ role: e.target.value as Me["role"] })}>
          <option value="부원">부원</option>
          <option value="운영진">운영진</option>
        </select>
      </td>
      <td className="p-2">
        <input className="w-16 rounded border p-1" type="number" value={cohort}
          disabled={mutation.isPending}
          onChange={(e) => setCohort(e.target.value)}
          onBlur={() => mutation.mutate({ cohort: cohort === "" ? null : Number(cohort) })} />
      </td>
    </tr>
  );
}
