"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  if (isLoading) return <div className="p-6">불러오는 중…</div>;
  if (!me) return null;
  return <AppShell>{children}</AppShell>;
}
