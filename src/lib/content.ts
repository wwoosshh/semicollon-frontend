// 콘텐츠 레이어(공지/게시판/댓글) — shared types + API calls.
// Bearer token is added automatically by api().

import { api } from "./api";

export interface Announcement {
  id: string;
  scope: "전체" | "space";
  space_id: string | null;
  title: string;
  body: string;
  created_at: string;
  author_name: string;
}

export interface PostListItem {
  id: string;
  scope: "전체" | "space";
  space_id: string | null;
  title: string;
  created_at: string;
  author_name: string;
  comment_count: string | number;
}

export interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
}

export interface PostDetail {
  id: string;
  scope: "전체" | "space";
  space_id: string | null;
  title: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
  comments: Comment[];
}

// ── Announcements ──────────────────────────────────────────────────────────

export function listAnnouncements(spaceId?: string) {
  return api<Announcement[]>(
    "/announcements" + (spaceId ? `?spaceId=${spaceId}` : ""),
  );
}

export function createAnnouncement(input: {
  spaceId?: string | null;
  title: string;
  body: string;
}) {
  return api("/announcements", {
    method: "POST",
    body: JSON.stringify({
      spaceId: input.spaceId ?? null,
      title: input.title,
      body: input.body,
    }),
  });
}

export function deleteAnnouncement(id: string) {
  return api(`/announcements/${id}`, { method: "DELETE" });
}

// ── Posts / Board ──────────────────────────────────────────────────────────

export function listPosts(spaceId?: string) {
  return api<PostListItem[]>(
    "/posts" + (spaceId ? `?spaceId=${spaceId}` : ""),
  );
}

export function getPost(id: string) {
  return api<PostDetail>(`/posts/${id}`);
}

export function createPost(input: {
  spaceId?: string | null;
  title: string;
  body: string;
}) {
  return api<{ id: string }>("/posts", {
    method: "POST",
    body: JSON.stringify({
      spaceId: input.spaceId ?? null,
      title: input.title,
      body: input.body,
    }),
  });
}

export function deletePost(id: string) {
  return api(`/posts/${id}`, { method: "DELETE" });
}

export function addComment(postId: string, body: string) {
  return api(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** ISO → `YYYY.MM.DD` (mono editorial date, like the homepage 2026.06.10). */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
