// 일정(Events) + 출석(Attendance) — shared types, API calls, editorial helpers.
// Bearer token is added automatically by api().

import { api } from "./api";

export type EventKind = "정기모임" | "세미나" | "발표" | "마감" | "행사" | "기타";
export type AttendanceStatus = "출석" | "지각" | "결석";

export const EVENT_KINDS: EventKind[] = [
  "정기모임",
  "세미나",
  "발표",
  "마감",
  "행사",
  "기타",
];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["출석", "지각", "결석"];

export interface EventItem {
  id: string;
  scope: "전체" | "space";
  space_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  kind: EventKind;
  created_by: string;
  space_title: string | null;
}

export interface AttendanceRow {
  user_id: string;
  name: string;
  status: AttendanceStatus;
  checked_at: string;
}

export interface EventDetail extends EventItem {
  attendance: AttendanceRow[];
  myStatus: AttendanceStatus | null;
  counts: { 출석: number; 지각: number; 결석: number };
  canManage: boolean;
}

// ── API calls ───────────────────────────────────────────────────────────────

/** Aggregated list (전체 + spaces visible to the user). */
export function listEvents(spaceId?: string) {
  return api<EventItem[]>("/events" + (spaceId ? `?spaceId=${spaceId}` : ""));
}

export function getEvent(id: string) {
  return api<EventDetail>(`/events/${id}`);
}

export function createEvent(input: {
  spaceId?: string | null;
  title: string;
  startsAt: string; // ISO
  endsAt?: string | null; // ISO or null
  location: string;
  kind: EventKind;
}) {
  const body: Record<string, unknown> = {
    title: input.title,
    startsAt: input.startsAt,
    endsAt: input.endsAt ?? null,
    location: input.location,
    kind: input.kind,
  };
  // Omit spaceId for global events; include it for space-scoped ones.
  if (input.spaceId) body.spaceId = input.spaceId;
  return api<{ id: string }>("/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteEvent(id: string) {
  return api(`/events/${id}`, { method: "DELETE" });
}

export function setMyAttendance(id: string, status: AttendanceStatus) {
  return api(`/events/${id}/attendance`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function setMemberAttendance(
  id: string,
  userId: string,
  status: AttendanceStatus,
) {
  return api(`/events/${id}/attendance/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Kind → chip color. Accent (vermillion) is reserved for 마감(deadline) only —
 * the one kind that should read as urgent. Everything else stays ink/muted so
 * the accent stays sparing per the design system.
 */
const KIND_COLORS: Record<EventKind, string> = {
  정기모임: "var(--ink)",
  세미나: "var(--ink-2)",
  발표: "var(--ink-2)",
  마감: "var(--accent)",
  행사: "var(--ink-2)",
  기타: "var(--muted-ink)",
};

export function kindColor(kind: EventKind): string {
  return KIND_COLORS[kind] ?? "var(--ink-2)";
}

/** Whether a kind is accent-worthy (the single urgent kind). */
export function isUrgentKind(kind: EventKind): boolean {
  return kind === "마감";
}

/** ISO → `HH:mm` (24h, mono editorial time). */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
