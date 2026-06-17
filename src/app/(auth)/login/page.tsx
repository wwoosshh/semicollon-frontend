"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(form) },
      );
      authStore.set(tokens);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* LEFT — statement panel */}
      <aside className="hidden flex-col justify-between border-r border-[var(--line)] bg-[var(--paper-2)] p-10 md:flex lg:p-14">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          // SEMICOLLON
        </p>
        <h1 className="font-serif text-4xl font-black leading-[1.2] tracking-tight text-[var(--ink)] lg:text-5xl">
          한 줄의 끝에서,
          <br />
          다시 로그인 <span className="text-[var(--accent)]">;</span>
        </h1>
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
          LOGIN
        </p>
      </aside>

      {/* RIGHT — form */}
      <main className="flex items-center justify-center p-8 sm:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--accent)] md:hidden">
            // SEMICOLLON
          </p>
          <h2 className="mb-8 font-serif text-2xl font-bold text-[var(--ink)]">
            로그인
          </h2>

          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                EMAIL
              </span>
              <input
                className="rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                type="email"
                placeholder="이메일"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                PASSWORD
              </span>
              <input
                className="rounded-[2px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                type="password"
                placeholder="비밀번호"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            {error && (
              <p className="font-mono text-[0.75rem] tracking-[0.04em] text-[var(--accent-ink)]">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full">
              로그인 →
            </Button>

            <a
              href="/signup"
              className="font-mono text-[0.75rem] tracking-[0.04em] text-[var(--ink-2)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
            >
              처음이신가요? 회원가입 →
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
