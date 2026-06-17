"use client";
import { useMe } from "@/lib/use-me";

export default function HomePage() {
  const { data: me } = useMe();
  return <h1 className="text-2xl font-bold">{me?.name}님, 환영합니다 👋</h1>;
}
