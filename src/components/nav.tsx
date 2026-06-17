import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex flex-col gap-1 p-3 text-sm">
      <Link href="/" className="rounded px-2 py-1 hover:bg-gray-100">홈</Link>
      <Link href="/members" className="rounded px-2 py-1 hover:bg-gray-100">멤버</Link>
    </nav>
  );
}
