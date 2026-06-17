"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";

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
    <form onSubmit={onSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-xl font-bold">세미콜론 로그인</h1>
      <input className="rounded border p-2" type="email" placeholder="이메일" required
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="rounded border p-2" type="password" placeholder="비밀번호" required
        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black p-2 text-white" type="submit">로그인</button>
      <a href="/signup" className="text-sm text-blue-600">처음이신가요? 회원가입</a>
    </form>
  );
}
