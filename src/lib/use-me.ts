"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: "운영진" | "부원";
  cohort: number | null;
  avatar_url: string | null;
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => api<Me>("/auth/me"),
    retry: false,
  });
}
