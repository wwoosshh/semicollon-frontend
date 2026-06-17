"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { num: "01", label: "홈", href: "/" },
  { num: "02", label: "멤버", href: "/members" },
  { num: "03", label: "활동공간", href: "/spaces" },
  { num: "04", label: "소식", href: "/news" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({
  onNavigate,
  orientation = "horizontal",
}: {
  onNavigate?: () => void;
  orientation?: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row items-center gap-6",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group inline-flex items-baseline gap-2 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors",
              orientation === "vertical" && "py-2",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]",
            )}
          >
            <span
              className={cn(
                "text-[0.6875rem] tracking-[0.1em]",
                active ? "text-[var(--accent)]" : "text-[var(--muted-ink)]",
              )}
            >
              {item.num}
            </span>
            <span
              className={cn(
                "border-b border-transparent pb-0.5",
                !active && "group-hover:border-[var(--ink)]",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
