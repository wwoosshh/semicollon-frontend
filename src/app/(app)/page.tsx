"use client";
import Link from "next/link";
import { useMe } from "@/lib/use-me";
import { MonoLabel } from "@/components/ui/mono-label";
import { SectionHeader } from "@/components/ui/section-header";

export default function HomePage() {
  const { data: me } = useMe();

  return (
    <div>
      {/* Editorial welcome */}
      <section className="mb-16">
        <MonoLabel as="p" className="mb-5">
          // SEMICOLLON · DASHBOARD
        </MonoLabel>
        <h1 className="font-serif text-4xl font-black leading-[1.15] tracking-tight text-[var(--ink)] sm:text-5xl">
          {me?.name}님, 환영합니다{" "}
          <span className="text-[var(--accent)]">;</span>
        </h1>
        <p className="mt-5 max-w-xl text-[var(--ink-2)] leading-relaxed">
          한 줄의 끝에서, 다음 줄을 시작합니다. 오늘의 작업을 이어가 보세요.
        </p>
      </section>

      {/* Quick menu */}
      <section>
        <SectionHeader number="01" title="빠른 메뉴" />
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
          <Link
            href="/members"
            className="group flex flex-col gap-3 bg-[var(--paper)] p-6 transition-colors hover:bg-[var(--paper-2)]"
          >
            <MonoLabel className="group-hover:text-[var(--accent)]">
              02 · MEMBERS
            </MonoLabel>
            <span className="font-serif text-xl font-bold text-[var(--ink)]">
              멤버
            </span>
            <span className="text-sm text-[var(--ink-2)]">
              동아리 구성원과 기수, 역할을 확인합니다.
            </span>
            <span className="mt-2 font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink-2)] transition-colors group-hover:text-[var(--accent)]">
              바로가기 →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
