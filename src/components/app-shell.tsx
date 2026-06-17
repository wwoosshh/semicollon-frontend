"use client";
import { useRouter } from "next/navigation";
import { Nav } from "./nav";
import { authStore } from "@/lib/auth-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  function logout() {
    authStore.clear();
    router.push("/login");
  }
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-48 flex-col border-r bg-gray-50">
        <div className="p-3 text-lg font-bold">세미콜론</div>
        <Nav />
        <button onClick={logout} className="mt-auto p-3 text-left text-sm text-gray-500 hover:text-black">
          로그아웃
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
