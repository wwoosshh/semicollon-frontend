"use client";
import { useState } from "react";
import type { FileItem, TreeNode } from "@/lib/files";
import { cn } from "@/lib/utils";

function Row({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: string | null;
  onSelect: (file: FileItem) => void;
}) {
  const isFolder = !!node.children;
  const [open, setOpen] = useState(depth < 1);

  // Indent with a hairline guide per depth level.
  const pad = { paddingLeft: `${depth * 0.875 + 0.5}rem` };

  if (isFolder) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={pad}
          className="flex w-full items-center gap-1.5 py-1.5 pr-2 text-left font-mono text-[0.75rem] tracking-[0.04em] text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
        >
          <span
            aria-hidden
            className="inline-block w-3 shrink-0 text-[var(--muted-ink)]"
          >
            {open ? "▾" : "▸"}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children!.length > 0 && (
          <ul className="border-l border-[var(--line)]">
            {node.children!.map((child) => (
              <Row
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // File leaf.
  const selected = !!node.file && node.file.id === selectedId;
  return (
    <li>
      <button
        type="button"
        onClick={() => node.file && onSelect(node.file)}
        style={pad}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-1.5 border-l-2 py-1.5 pr-2 text-left font-mono text-[0.75rem] tracking-[0.02em] transition-colors",
          selected
            ? "border-[var(--accent)] bg-[var(--paper-2)] text-[var(--accent)]"
            : "border-transparent text-[var(--ink)] hover:bg-[var(--paper-2)]",
        )}
      >
        <span aria-hidden className="inline-block w-3 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

/** Nested, collapsible, editorial/mono file tree. */
export function FileTree({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect: (file: FileItem) => void;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <Row
          key={node.path}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
