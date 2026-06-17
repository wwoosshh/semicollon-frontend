"use client";
import Link from "next/link";
import { MonoLabel } from "@/components/ui/mono-label";

const INDEX = [
  { label: "홈", href: "/" },
  { label: "활동공간", href: "/spaces" },
  { label: "캘린더", href: "/calendar" },
  { label: "소식", href: "/news" },
  { label: "멤버", href: "/members" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          {/* Brand */}
          <div className="max-w-sm">
            <p className="font-serif text-2xl font-bold leading-none tracking-tight text-[var(--ink)]">
              세미콜론<span className="text-[var(--accent)]">;</span>
            </p>
            <MonoLabel as="p" className="mt-4">
              PROGRAMMING CLUB — SEMICOLLON
            </MonoLabel>
          </div>

          {/* Index */}
          <nav aria-label="사이트 인덱스">
            <MonoLabel as="p" className="mb-4">
              INDEX
            </MonoLabel>
            <ul className="flex flex-col gap-2.5">
              {INDEX.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-baseline gap-2 font-mono text-[0.8125rem] tracking-[0.04em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                  >
                    <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[var(--ink)]">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom rule */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <MonoLabel as="p">© 2026 SEMICOLLON. ALL RIGHTS RESERVED.</MonoLabel>
          <MonoLabel as="p">SET IN NOTO SERIF KR · IBM PLEX MONO</MonoLabel>
        </div>
      </div>
    </footer>
  );
}
