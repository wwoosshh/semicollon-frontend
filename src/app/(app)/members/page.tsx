"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe, type Me } from "@/lib/use-me";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusDot } from "@/components/ui/status-dot";
import { MemberRow } from "./member-row";
import { InviteCodePanel } from "./invite-code-panel";

function ColHead({ ko, en }: { ko: string; en: string }) {
  return (
    <th className="px-3 py-3 text-left font-normal align-bottom">
      <span className="block text-[0.8125rem] font-medium text-[var(--ink-2)]">
        {ko}
      </span>
      <span className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        {en}
      </span>
    </th>
  );
}

export default function MembersPage() {
  const { data: me } = useMe();
  const { data: members } = useQuery<Me[]>({
    queryKey: ["members"],
    queryFn: () => api<Me[]>("/members"),
  });
  const canEdit = me?.role === "운영진";

  return (
    <div>
      <SectionHeader
        number="02"
        title="멤버"
        right={
          members ? (
            <StatusDot color="var(--accent)">{members.length} 명</StatusDot>
          ) : null
        }
      />
      {canEdit && <InviteCodePanel />}
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--ink)]">
            <ColHead ko="이름" en="NAME" />
            <ColHead ko="역할" en="ROLE" />
            <ColHead ko="기수" en="COHORT" />
          </tr>
        </thead>
        <tbody>
          {members?.map((m) => (
            <MemberRow key={m.id} member={m} canEdit={canEdit} />
          ))}
        </tbody>
      </table>
      {members && members.length === 0 && (
        <p className="mt-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          NO MEMBERS
        </p>
      )}
    </div>
  );
}
