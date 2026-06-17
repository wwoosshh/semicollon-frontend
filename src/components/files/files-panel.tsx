"use client";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type FileItem,
  type FileChannel,
  buildTree,
  deleteFile,
  getFileChannel,
  listFiles,
  pathsFromDataTransfer,
  pathsFromFileList,
  saveTree,
} from "@/lib/files";
import { FileTree } from "@/components/files/file-tree";
import { ChannelChat } from "@/components/chat/channel-chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FilesPanel({
  spaceId,
  canManage,
}: {
  spaceId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", spaceId],
    queryFn: () => listFiles(spaceId),
  });

  const tree = useMemo(() => buildTree(files), [files]);

  const saveM = useMutation({
    mutationFn: (paths: string[]) => saveTree(spaceId, paths),
    onSuccess: (items, paths) => {
      setSaved(paths.length);
      qc.invalidateQueries({ queryKey: ["files", spaceId] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["files", spaceId] });
    },
  });

  // Resolve channel for the selected file.
  const { data: channel } = useQuery<FileChannel>({
    queryKey: ["fileChannel", selected?.id],
    queryFn: () => getFileChannel(selected!.id),
    enabled: !!selected,
  });

  function commit(paths: string[]) {
    if (paths.length === 0) {
      setSaved(0);
      return;
    }
    saveM.mutate(paths);
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const paths = await pathsFromDataTransfer(e.dataTransfer.items);
    commit(paths);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const paths = pathsFromFileList(e.target.files);
    commit(paths);
    e.target.value = "";
  }

  return (
    <div>
      {/* Intake controls */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-[var(--accent)] bg-[var(--paper-2)]"
            : "border-[var(--line)] bg-[var(--paper)]",
        )}
      >
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ink-2)]">
          프로젝트 폴더를 여기에 드래그앤드롭
        </p>
        <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--muted-ink)]">
          파일 내용이 아니라 구조(경로)만 저장됩니다
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={saveM.isPending}
          className="mt-1 font-mono text-[0.8125rem] tracking-[0.06em]"
        >
          {saveM.isPending ? "저장 중…" : "폴더 선택"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPick}
          className="hidden"
          // @ts-expect-error — non-standard directory upload attributes
          webkitdirectory=""
          directory=""
        />
        {saved !== null && (
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--accent)]">
            {saved > 0
              ? `${saved}개 파일 구조 저장됨`
              : "무시되는 파일만 있었습니다"}
          </p>
        )}
        {saveM.error && (
          <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--accent)]">
            {(saveM.error as Error).message}
          </p>
        )}
      </div>

      {/* Split: tree | chat */}
      <div className="mt-8 md:grid md:grid-cols-[20rem_1fr] md:gap-px md:bg-[var(--line)]">
        {/* LEFT — tree */}
        <div className="md:bg-[var(--paper)] md:pr-6">
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--ink)] pb-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--ink-2)]">
              FILES
            </span>
            <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-[var(--muted-ink)]">
              {files.length}
            </span>
          </div>
          {isLoading ? (
            <p className="py-6 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              LOADING…
            </p>
          ) : files.length === 0 ? (
            <p className="py-6 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--muted-ink)]">
              아직 저장된 구조가 없습니다 — 위에 폴더를 드롭하세요
            </p>
          ) : (
            <FileTree
              nodes={tree}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* RIGHT — selected file's chat */}
        <div className="mt-8 md:mt-0 md:bg-[var(--paper)] md:pl-6">
          {!selected ? (
            <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--muted-ink)]">
              왼쪽에서 파일을 선택하면 그 파일의 토론방이 열립니다
            </p>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <span className="truncate font-mono text-[0.75rem] tracking-[0.02em] text-[var(--ink)]">
                  {selected.path}
                </span>
                {canManage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteM.mutate(selected.id)}
                    disabled={deleteM.isPending}
                    className="shrink-0 font-mono text-[0.6875rem] tracking-[0.08em]"
                  >
                    {deleteM.isPending ? "삭제 중…" : "삭제"}
                  </Button>
                )}
              </div>
              {channel ? (
                <ChannelChat channelId={channel.id} />
              ) : (
                <p className="py-12 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                  토론방 여는 중…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
