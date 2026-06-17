"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/auth/signup",
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
      <h1 className="text-xl font-bold">세미콜론 회원가입</h1>
      <input className="rounded border p-2" placeholder="이름" required
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="rounded border p-2" type="email" placeholder="이메일" required
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="rounded border p-2" type="password" placeholder="비밀번호(6자 이상)" required
        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black p-2 text-white" type="submit">가입하기</button>
      <a href="/login" className="text-sm text-blue-600">이미 계정이 있어요</a>
    </form>
  );
}
