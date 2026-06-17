"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/app-shell";
import { VoiceProvider } from "@/components/voice/voice-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  if (isLoading) return <div className="p-6">불러오는 중…</div>;
  if (!me) return null;
  return (
    <VoiceProvider>
      <AppShell>{children}</AppShell>
    </VoiceProvider>
  );
}
