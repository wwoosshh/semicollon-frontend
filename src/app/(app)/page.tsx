"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import {
  type SpaceListItem,
  statusColor,
  typeEn,
} from "@/lib/spaces";
import {
  type EventItem,
  formatTime,
  kindColor,
} from "@/lib/events";
import {
  type Announcement,
  type PostListItem,
  formatDate,
} from "@/lib/content";
import { MonoLabel } from "@/components/ui/mono-label";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusDot } from "@/components/ui/status-dot";
import {
  IconSpaces,
  IconCalendar,
  IconNews,
  IconMembers,
  IconArrowUpRight,
  type IconProps,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// ── Reveal stagger helper ────────────────────────────────────────────────────
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

// ── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { data: me } = useMe();
  return (
    <section className="reveal" style={delay(0)}>
      <div className="grid gap-10 lg:grid-cols-[1fr_18rem] lg:gap-16">
        {/* Left: statement */}
        <div>
          <MonoLabel as="p" className="mb-6">
            // 세미콜론 — 프로그래밍 동아리 플랫폼
          </MonoLabel>
          <h1 className="font-serif text-[2.5rem] font-black leading-[1.1] tracking-tight text-[var(--ink)] sm:text-6xl">
            한 줄의 끝에서,
            <br />
            같이 다음 줄을 쓴다{" "}
            <span className="text-[var(--accent)]">;</span>
          </h1>
          <p className="mt-7 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            세미콜론은 함께 코드를 읽고, 만들고, 기록하는 사람들의 공간입니다.
            프로젝트를 제안하고, 모여서 만들고, 일정과 출석을 관리하고,
            텍스트·음성으로 소통합니다.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/spaces"
              className="inline-flex h-10 items-center gap-2 rounded-[2px] bg-[var(--ink)] px-5 font-mono text-[0.8125rem] tracking-[0.06em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)]"
            >
              활동공간 둘러보기 →
            </Link>
            <Link
              href="/news"
              className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-[var(--ink)] px-5 font-mono text-[0.8125rem] tracking-[0.06em] text-[var(--ink)] transition-colors hover:bg-[var(--paper-2)]"
            >
              소식 보기
            </Link>
          </div>
        </div>

        {/* Right: user info panel */}
        <aside className="border-t border-[var(--line)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
          <MonoLabel as="p" className="mb-5">
            CURRENT SESSION
          </MonoLabel>
          <dl className="flex flex-col">
            <InfoRow label="MEMBER" value={me?.name ?? "—"} />
            <InfoRow
              label="ROLE"
              value={me?.role ?? "—"}
              accent={me?.role === "운영진"}
            />
            <InfoRow
              label="COHORT"
              value={me?.cohort != null ? `${me.cohort}기` : "—"}
              last
            />
          </dl>
        </aside>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-t border-[var(--line)] py-3.5",
        last && "border-b",
      )}
    >
      <MonoLabel as="dt">{label}</MonoLabel>
      <dd
        className={cn(
          "text-right text-[0.95rem] font-medium",
          accent ? "text-[var(--accent)]" : "text-[var(--ink)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ── 01 · 플랫폼 둘러보기 ───────────────────────────────────────────────────────

const PLATFORM: {
  num: string;
  href: string;
  ko: string;
  en: string;
  desc: string;
  Icon: (p: IconProps) => React.ReactElement;
}[] = [
  {
    num: "01",
    href: "/spaces",
    ko: "활동공간",
    en: "SPACES",
    desc: "프로젝트·세미나·대회를 제안하고 모여서 함께 만듭니다.",
    Icon: IconSpaces,
  },
  {
    num: "02",
    href: "/calendar",
    ko: "캘린더",
    en: "CALENDAR",
    desc: "정기모임과 일정, 출석을 한곳에서 관리합니다.",
    Icon: IconCalendar,
  },
  {
    num: "03",
    href: "/news",
    ko: "소식",
    en: "NEWS",
    desc: "공지와 게시판으로 동아리의 흐름을 기록합니다.",
    Icon: IconNews,
  },
  {
    num: "04",
    href: "/members",
    ko: "멤버",
    en: "MEMBERS",
    desc: "구성원과 기수, 역할을 확인합니다.",
    Icon: IconMembers,
  },
];

function PlatformGrid() {
  return (
    <section className="reveal" style={delay(80)}>
      <SectionHeader number="01" title="플랫폼 둘러보기" />
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM.map(({ num, href, ko, en, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col gap-4 bg-[var(--paper)] p-6 transition-colors hover:bg-[var(--paper-2)]"
          >
            {/* left accent rule slides in on hover */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-[var(--accent)] transition-transform duration-300 group-hover:scale-y-100"
            />
            <div className="flex items-start justify-between">
              <Icon
                size={24}
                className="text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]"
              />
              <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
                {num}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                {ko}
              </h3>
              <MonoLabel as="p" className="mt-1.5">
                {en}
              </MonoLabel>
            </div>
            <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
              {desc}
            </p>
            <IconArrowUpRight
              size={16}
              className="mt-auto translate-y-1 text-[var(--muted-ink)] opacity-0 transition-all group-hover:translate-y-0 group-hover:text-[var(--accent)] group-hover:opacity-100"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── 02 · 진행 중인 활동 ────────────────────────────────────────────────────────

function ActiveSpaces() {
  const { data, isLoading } = useQuery<SpaceListItem[]>({
    queryKey: ["spaces"],
    queryFn: () => api<SpaceListItem[]>("/spaces"),
  });

  const live = data?.filter(
    (s) => s.status === "모집중" || s.status === "진행중",
  );
  const fallback = [...(data ?? [])].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
  const spaces = (live && live.length > 0 ? live : fallback).slice(0, 4);

  return (
    <section className="reveal" style={delay(160)}>
      <SectionHeader
        number="02"
        title="진행 중인 활동"
        right={<RightLink href="/spaces">전체 보기 →</RightLink>}
      />
      {isLoading ? (
        <SkeletonGrid cols={2} rows={2} />
      ) : spaces.length > 0 ? (
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
          {spaces.map((s) => (
            <Link
              key={s.id}
              href={`/spaces/${s.id}`}
              className="group relative flex flex-col gap-3 bg-[var(--paper)] p-5 transition-colors hover:bg-[var(--paper-2)]"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-[var(--accent)] transition-transform duration-300 group-hover:scale-y-100"
              />
              <div className="flex items-center justify-between gap-3">
                <MonoLabel accent>{typeEn(s.type)}</MonoLabel>
                <StatusDot color={statusColor(s.status)}>{s.status}</StatusDot>
              </div>
              <h3 className="font-serif text-lg font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                {s.title}
              </h3>
              <span className="font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)]">
                {s.member_count}명 참여
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyRow
          hint="아직 진행 중인 활동이 없습니다"
          href="/spaces/new"
          cta="활동 제안하기 →"
        />
      )}
    </section>
  );
}

// ── 03 · 다가오는 일정 ─────────────────────────────────────────────────────────

function UpcomingEvents() {
  const { data, isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: () => api<EventItem[]>("/events"),
  });

  const now = Date.now();
  const upcoming = [...(data ?? [])]
    .filter((e) => +new Date(e.starts_at) >= now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
    .slice(0, 3);

  return (
    <section className="reveal" style={delay(240)}>
      <SectionHeader
        number="03"
        title="다가오는 일정"
        right={<RightLink href="/calendar">캘린더 →</RightLink>}
      />
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : upcoming.length > 0 ? (
        <ul className="border-t border-[var(--line)]">
          {upcoming.map((e) => (
            <li key={e.id}>
              <Link
                href={`/events/${e.id}`}
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 border-b border-[var(--line)] py-4 transition-colors hover:bg-[var(--paper-2)] sm:grid-cols-[7rem_auto_1fr_auto]"
              >
                <span className="font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)]">
                  {formatDate(e.starts_at)}{" "}
                  <span className="text-[var(--muted-ink)]">
                    {formatTime(e.starts_at)}
                  </span>
                </span>
                <StatusDot color={kindColor(e.kind)} className="hidden sm:inline-flex">
                  {e.kind}
                </StatusDot>
                <span className="font-serif text-base font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:col-auto col-span-2">
                  {e.title}
                </span>
                <span className="font-mono text-[0.72rem] tracking-[0.04em] text-[var(--muted-ink)] col-span-2 sm:col-auto sm:text-right">
                  {e.location || "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRow hint="예정된 일정이 없습니다" href="/calendar" cta="캘린더 →" />
      )}
    </section>
  );
}

// ── 04 · 최근 소식 ─────────────────────────────────────────────────────────────

type NewsRow = {
  id: string;
  kind: "공지" | "글";
  title: string;
  author: string;
  date: string;
  href: string;
  ts: number;
};

function RecentNews() {
  const ann = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: () => api<Announcement[]>("/announcements"),
  });
  const posts = useQuery<PostListItem[]>({
    queryKey: ["posts"],
    queryFn: () => api<PostListItem[]>("/posts"),
  });

  const isLoading = ann.isLoading || posts.isLoading;

  const rows: NewsRow[] = [
    ...(ann.data ?? []).map((a) => ({
      id: `a-${a.id}`,
      kind: "공지" as const,
      title: a.title,
      author: a.author_name,
      date: formatDate(a.created_at),
      href: "/news",
      ts: +new Date(a.created_at),
    })),
    ...(posts.data ?? []).map((p) => ({
      id: `p-${p.id}`,
      kind: "글" as const,
      title: p.title,
      author: p.author_name,
      date: formatDate(p.created_at),
      href: `/posts/${p.id}`,
      ts: +new Date(p.created_at),
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 4);

  return (
    <section className="reveal" style={delay(320)}>
      <SectionHeader
        number="04"
        title="최근 소식"
        right={<RightLink href="/news">소식 →</RightLink>}
      />
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : rows.length > 0 ? (
        <ul className="border-t border-[var(--line)]">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 border-b border-[var(--line)] py-4 transition-colors hover:bg-[var(--paper-2)] sm:grid-cols-[6rem_3rem_1fr_auto]"
              >
                <span className="font-mono text-[0.75rem] tracking-[0.06em] text-[var(--ink-2)]">
                  {r.date}
                </span>
                <span
                  className={cn(
                    "hidden font-mono text-[0.65rem] uppercase tracking-[0.1em] sm:inline",
                    r.kind === "공지"
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted-ink)]",
                  )}
                >
                  {r.kind}
                </span>
                <span className="col-span-2 font-serif text-base font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:col-auto">
                  <span className="mr-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--accent)] sm:hidden">
                    {r.kind === "공지" ? "공지" : ""}
                  </span>
                  {r.title}
                </span>
                <span className="col-span-2 font-mono text-[0.72rem] tracking-[0.04em] text-[var(--muted-ink)] sm:col-auto sm:text-right">
                  {r.author}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRow hint="아직 소식이 없습니다" href="/news" cta="소식 →" />
      )}
    </section>
  );
}

// ── MARQUEE band ───────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "WE WRITE THE NEXT LINE TOGETHER",
  "SEMICOLLON ;",
  "STUDY",
  "PROJECT",
  "EVENT",
];

function MarqueeUnit() {
  return (
    <span className="flex items-center">
      {MARQUEE_ITEMS.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 font-mono text-[0.8125rem] uppercase tracking-[0.18em] text-[var(--on-dark)]">
            {t}
          </span>
          <span aria-hidden className="text-[var(--accent)]">
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

function MarqueeBand() {
  return (
    <section
      className="reveal -mx-5 overflow-hidden bg-[var(--dark)] py-4 sm:-mx-8"
      style={delay(400)}
      aria-hidden
    >
      <div className="marquee-track">
        {/* duplicated ×2 for a seamless -50% loop */}
        <MarqueeUnit />
        <MarqueeUnit />
      </div>
    </section>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────────

function RightLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
    >
      <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-[var(--accent)]">
        {children}
      </span>
    </Link>
  );
}

function EmptyRow({
  hint,
  href,
  cta,
}: {
  hint: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 border border-[var(--line)] px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
        {hint}
      </p>
      <Link
        href={href}
        className="font-mono text-[0.75rem] tracking-[0.08em] text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
      >
        {cta}
      </Link>
    </div>
  );
}

function SkeletonGrid({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div
      className="grid gap-px bg-[var(--line)]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 bg-[var(--paper)] p-5"
        >
          <div className="h-3 w-16 bg-[var(--paper-2)]" />
          <div className="h-5 w-2/3 bg-[var(--paper-2)]" />
          <div className="h-3 w-20 bg-[var(--paper-2)]" />
        </div>
      ))}
    </div>
  );
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="border-t border-[var(--line)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-5 border-b border-[var(--line)] py-4"
        >
          <div className="h-3 w-20 bg-[var(--paper-2)]" />
          <div className="h-4 flex-1 bg-[var(--paper-2)]" />
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      <Hero />
      <PlatformGrid />
      <ActiveSpaces />
      <UpcomingEvents />
      <RecentNews />
      <MarqueeBand />
    </div>
  );
}
