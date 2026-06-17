"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { Button } from "@/components/ui/button";
import { authStore } from "@/lib/auth-store";
import { useMe } from "@/lib/use-me";

function Logo() {
  return (
    <Link
      href="/"
      className="font-serif text-xl font-bold leading-none tracking-tight text-[var(--ink)]"
      aria-label="세미콜론 홈"
    >
      세미콜론<span className="text-[var(--accent)]">;</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);

  function logout() {
    authStore.clear();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar (3px accent bar is global via body::before) */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-10">
            <Logo />
            <div className="hidden md:block">
              <Nav />
            </div>
          </div>

          {/* Right: user + logout (desktop) */}
          <div className="hidden items-center gap-4 md:flex">
            {me?.name && (
              <span className="font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink-2)]">
                {me.name}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="font-mono text-[0.75rem] tracking-[0.08em]"
            >
              로그아웃
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="메뉴"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className="h-px w-5 bg-[var(--ink)]" />
            <span className="h-px w-5 bg-[var(--ink)]" />
            <span className="h-px w-5 bg-[var(--ink)]" />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-[var(--line)] px-5 py-4 md:hidden">
            <Nav orientation="vertical" onNavigate={() => setOpen(false)} />
            <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
              {me?.name && (
                <span className="font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink-2)]">
                  {me.name}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="font-mono text-[0.75rem] tracking-[0.08em]"
              >
                로그아웃
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <Footer />
    </div>
  );
}
