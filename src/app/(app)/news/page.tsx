"use client";
import { useMe } from "@/lib/use-me";
import { SectionHeader } from "@/components/ui/section-header";
import { MonoLabel } from "@/components/ui/mono-label";
import { AnnouncementList } from "@/components/content/announcement-list";
import { BoardList } from "@/components/content/board-list";

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <MonoLabel className="text-[var(--ink-2)]">{children}</MonoLabel>
      <div className="mt-2 h-px w-full bg-[var(--line)]" />
    </div>
  );
}

export default function NewsPage() {
  const { data: me } = useMe();

  return (
    <div>
      <SectionHeader number="04" title="소식" />

      <section className="mb-16">
        <SubLabel>공지 · ANNOUNCEMENTS</SubLabel>
        <AnnouncementList canPost={me?.role === "운영진"} />
      </section>

      <section>
        <SubLabel>게시판 · BOARD</SubLabel>
        <BoardList />
      </section>
    </div>
  );
}
