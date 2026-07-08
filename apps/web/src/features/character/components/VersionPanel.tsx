import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  versionApi,
  type VersionItem,
  type VersionDetail,
} from "@/shared/api/versions";
import { CHARACTER_KEYS } from "@/shared/hooks/useCharacters";
import { Button } from "@/shared/components/ui";

interface VersionPanelProps {
  characterId: string;
}

export default function VersionPanel({ characterId }: VersionPanelProps) {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["versions", characterId],
    queryFn: () => versionApi.list(characterId),
  });

  const rollbackMutation = useMutation({
    mutationFn: (versionId: string) =>
      versionApi.rollback(characterId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHARACTER_KEYS.detail(characterId),
      });
      queryClient.invalidateQueries({ queryKey: ["versions", characterId] });
      setPreviewOpen(false);
      window.location.reload();
    },
  });

  const handlePreview = async (version: VersionItem) => {
    const detail = await versionApi.get(characterId, version.id);
    setSelectedVersion(detail);
    setPreviewOpen(true);
  };

  const handleRollback = async () => {
    if (!selectedVersion) return;
    if (
      !confirm(
        `确定回滚到 v${selectedVersion.version_number}？当前未保存的更改将丢失。`,
      )
    )
      return;
    rollbackMutation.mutate(selectedVersion.id);
  };

  if (isLoading)
    return <p className="text-sm text-ink-muted py-4">加载版本历史...</p>;
  if (!versions || versions.length === 0) {
    return (
      <p className="text-sm text-ink-muted py-4">
        暂无版本历史，编辑角色后自动保存版本
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 版本列表 */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {versions.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between py-3 px-4 bg-canvas rounded-xl hover:bg-canvas transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  v{v.version_number}
                </span>
                <span className="text-xs text-ink-muted">
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>
              {v.change_summary && (
                <p className="text-xs text-ink-muted mt-0.5 truncate">
                  {v.change_summary}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => handlePreview(v)}
                className="text-xs text-ink-muted hover:text-brand transition-colors"
              >
                预览
              </button>
              <button
                onClick={() => {
                  if (confirm(`回滚到 v${v.version_number}？`)) {
                    rollbackMutation.mutate(v.id);
                  }
                }}
                className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                回滚
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 预览弹窗 */}
      {previewOpen && selectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-ink mb-4">
              版本 v{selectedVersion.version_number} 预览
            </h3>
            <pre className="bg-canvas rounded-xl p-4 text-sm text-ink whitespace-pre-wrap max-h-96 overflow-y-auto">
              {JSON.stringify(selectedVersion.character_data, null, 2)}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                关闭
              </Button>
              <Button
                variant="danger"
                onClick={handleRollback}
                loading={rollbackMutation.isPending}
              >
                回滚到此版本
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
