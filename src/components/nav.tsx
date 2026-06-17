"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconHome,
  IconMembers,
  IconSpaces,
  IconNews,
  IconCalendar,
  type IconProps,
} from "@/components/ui/icons";

type IconCmp = (props: IconProps) => React.ReactElement;

export const NAV_ITEMS: {
  num: string;
  label: string;
  href: string;
  Icon: IconCmp;
}[] = [
  { num: "01", label: "홈", href: "/", Icon: IconHome },
  { num: "02", label: "멤버", href: "/members", Icon: IconMembers },
  { num: "03", label: "활동공간", href: "/spaces", Icon: IconSpaces },
  { num: "04", label: "소식", href: "/news", Icon: IconNews },
  { num: "05", label: "캘린더", href: "/calendar", Icon: IconCalendar },
];

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
        const { Icon } = item;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group inline-flex items-center gap-2 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors",
              orientation === "vertical" && "py-2",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]",
            )}
          >
            <Icon
              size={16}
              className={cn(
                "transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted-ink)] group-hover:text-[var(--ink)]",
              )}
            />
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
                "relative pb-0.5",
                // animated underline indicator: scales in from the left on hover,
                // stays drawn when active
                "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:transition-transform",
                active
                  ? "after:scale-x-100 after:bg-[var(--accent)]"
                  : "after:scale-x-0 after:bg-[var(--ink)] group-hover:after:scale-x-100",
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
