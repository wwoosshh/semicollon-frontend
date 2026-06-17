"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe, type Me } from "@/lib/use-me";
import { MemberRow } from "./member-row";

export default function MembersPage() {
  const { data: me } = useMe();
  const { data: members } = useQuery<Me[]>({
    queryKey: ["members"],
    queryFn: () => api<Me[]>("/members"),
  });
  const canEdit = me?.role === "운영진";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">멤버</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">이름</th>
            <th className="p-2">역할</th>
            <th className="p-2">기수</th>
          </tr>
        </thead>
        <tbody>
          {members?.map((m) => <MemberRow key={m.id} member={m} canEdit={canEdit} />)}
        </tbody>
      </table>
    </div>
  );
}
