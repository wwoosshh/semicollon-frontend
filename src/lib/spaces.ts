// 활동공간(Spaces) — shared types + editorial helpers.
// API contract mirrors the backend /spaces routes.

export type SpaceType = "프로젝트" | "세미나" | "코딩대회" | "해커톤";
export type SpaceStatus = "제안중" | "모집중" | "진행중" | "완료" | "보관";

export interface SpaceListItem {
  id: string;
  type: SpaceType;
  title: string;
  description: string;
  status: SpaceStatus;
  created_by: string;
  created_at: string;
  member_count: string | number;
}

export interface SpaceMember {
  user_id: string;
  name: string;
  role: "리더" | "멤버";
  joined_at: string;
}

export interface SpaceDetail {
  id: string;
  type: SpaceType;
  title: string;
  description: string;
  status: SpaceStatus;
  created_by: string;
  created_at: string;
  members: SpaceMember[];
  myRole: "리더" | "멤버" | null;
}

export const SPACE_TYPES: readonly SpaceType[] = [
  "프로젝트",
  "세미나",
  "코딩대회",
  "해커톤",
];

export const SPACE_STATUSES: readonly SpaceStatus[] = [
  "제안중",
  "모집중",
  "진행중",
  "완료",
  "보관",
];

/**
 * Status → dot color. Accent (vermillion) is reserved for the "live/open"
 * states (모집중 = recruiting) so the accent stays sparing. Everything else
 * is an ink/muted dot, dimming toward 보관(archived).
 */
const STATUS_COLORS: Record<SpaceStatus, string> = {
  제안중: "var(--ink-2)",
  모집중: "var(--accent)",
  진행중: "var(--ink)",
  완료: "var(--muted-ink)",
  보관: "var(--line)",
};

export function statusColor(status: SpaceStatus): string {
  return STATUS_COLORS[status] ?? "var(--ink-2)";
}

/** Whether a status should read as "accent-worthy" (the single live state). */
export function isLiveStatus(status: SpaceStatus): boolean {
  return status === "모집중";
}

/** Latin mono caption per type, for editorial meta lines (e.g. PROJECT). */
const TYPE_EN: Record<SpaceType, string> = {
  프로젝트: "PROJECT",
  세미나: "SEMINAR",
  코딩대회: "CONTEST",
  해커톤: "HACKATHON",
};

export function typeEn(type: SpaceType): string {
  return TYPE_EN[type] ?? "SPACE";
}
