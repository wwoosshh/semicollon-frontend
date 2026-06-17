import { api } from "./api";

export interface FileItem {
  id: string;
  space_id: string;
  name: string;
  path: string;
  created_at: string;
}

export interface FileChannel {
  id: string;
  name: string;
  space_id: string;
  file_id: string;
  created_at: string;
}

// ── API ──────────────────────────────────────────────────────────────

/** Ordered (by path) list of the space's stored file paths. */
export function listFiles(spaceId: string): Promise<FileItem[]> {
  return api<FileItem[]>(`/spaces/${spaceId}/files`);
}

/** Upsert a set of relative paths (dedup, keeps existing). */
export function saveTree(spaceId: string, paths: string[]): Promise<FileItem[]> {
  return api<FileItem[]>(`/spaces/${spaceId}/files/tree`, {
    method: "POST",
    body: JSON.stringify({ paths }),
  });
}

export function deleteFile(fileId: string): Promise<{ deleted: boolean }> {
  return api<{ deleted: boolean }>(`/files/${fileId}`, { method: "DELETE" });
}

/** Ensures + returns the per-file chat channel. */
export function getFileChannel(fileId: string): Promise<FileChannel> {
  return api<FileChannel>(`/files/${fileId}/channel`);
}

// ── Ignore rules ─────────────────────────────────────────────────────

export const IGNORED = new Set<string>([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
  ".vercel",
  "coverage",
  ".turbo",
  ".DS_Store",
]);

/** True if any path segment is in the IGNORED set. */
export function isIgnored(path: string): boolean {
  return path.split("/").some((seg) => IGNORED.has(seg));
}

// ── Path extraction ──────────────────────────────────────────────────

/** From a <input webkitdirectory> FileList → filtered relative paths. */
export function pathsFromFileList(files: FileList): string[] {
  return Array.from(files)
    .map((f) => (f as unknown as { webkitRelativePath?: string }).webkitRelativePath || f.name)
    .filter((p) => !isIgnored(p));
}

/** Traverse dropped folders via webkitGetAsEntry() → filtered relative paths. */
export async function pathsFromDataTransfer(
  items: DataTransferItemList,
): Promise<string[]> {
  const roots: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const e = (items[i] as any).webkitGetAsEntry?.();
    if (e) roots.push(e);
  }
  const out: string[] = [];
  async function walk(entry: any, prefix: string) {
    const full = prefix + entry.name;
    if (entry.isFile) {
      if (!isIgnored(full)) out.push(full);
      return;
    }
    if (entry.isDirectory) {
      if (isIgnored(full)) return;
      const reader = entry.createReader();
      const readBatch = (): Promise<any[]> =>
        new Promise((res) =>
          reader.readEntries(
            (es: any[]) => res(es),
            () => res([]),
          ),
        );
      let batch = await readBatch();
      const children: any[] = [];
      while (batch.length) {
        children.push(...batch);
        batch = await readBatch();
      }
      for (const c of children) await walk(c, full + "/");
    }
  }
  for (const r of roots) await walk(r, "");
  return out;
}

// ── Tree building ────────────────────────────────────────────────────

export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  file?: FileItem;
}

/**
 * Turn the flat FileItem list into a nested tree.
 * Folders are intermediate nodes; files are leaves carrying their FileItem.
 */
export function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [] };

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    let cursor = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLeaf = i === segments.length - 1;
      const segPath = segments.slice(0, i + 1).join("/");
      if (!cursor.children) cursor.children = [];
      let next = cursor.children.find((c) => c.name === seg);
      if (!next) {
        next = { name: seg, path: segPath };
        if (!isLeaf) next.children = [];
        cursor.children.push(next);
      }
      if (isLeaf) next.file = file;
      cursor = next;
    }
  }

  // Sort: folders first, then files, both alphabetical.
  function sort(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const aDir = !!a.children;
      const bDir = !!b.children;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.children) sort(n.children);
  }
  sort(root.children!);
  return root.children!;
}
