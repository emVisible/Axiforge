import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useEditorStore, emptyCharacterData } from "@/stores";
import { useCreateCharacter } from "@/hooks/useCharacters";
import { CharacterEditor } from "@/modules/character";
import { Button } from "@/components/ui";
import { draftManager, CREATE_DRAFT_ID } from "@/lib/draftManager";
import DraftRestoreDialog from "@/components/ui/DraftRestoreDialog";
import { routes } from "@/lib/routes";
import { getCreatorId } from "@/lib/creatorId";
import { aiApi } from "@/api/ai";

export default function CreateCharacterPage() {
  const navigate = useNavigate();
  const { draft, setDraft, reset } = useEditorStore();
  const createCharacter = useCreateCharacter();

  const [isPublic, setIsPublic] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = draftManager.load(CREATE_DRAFT_ID);
    if (saved && !draft) {
      setShowDraftDialog(true);
    } else if (!draft) {
      setDraft(emptyCharacterData);
    }
    setReady(true);
  }, []);

  const handleRestoreDraft = (draftId: string) => {
    const saved = draftManager.load(draftId);
    if (saved) setDraft(saved);
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    draftManager.remove(CREATE_DRAFT_ID);
    setShowDraftDialog(false);
    setDraft(emptyCharacterData);
  };

  if (showDraftDialog) {
    return (
      <DraftRestoreDialog
        isOpen={true}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    );
  }

  if (!draft || !ready) return null;

  const handleAiSuggest = async () => {
    if (!draft.anchor?.name?.trim()) {
      setError("请先填写角色名称");
      return;
    }
    setAiBusy(true);
    setError(null);
    try {
      const res = await aiApi.suggestCharacter({
        name: draft.anchor.name,
        essence: draft.anchor.essence || "",
        tags: draft.anchor.tags || [],
      });
      setDraft({
        ...draft,
        anchor: { ...draft.anchor, ...res.layers.anchor },
        contour: { ...draft.contour, ...res.layers.contour },
        demeanor: { ...draft.demeanor, ...res.layers.demeanor },
        psyche: { ...draft.psyche, ...res.layers.psyche },
        trace: { ...draft.trace, ...res.layers.trace },
        bond: { ...draft.bond, ...res.layers.bond },
      });
    } catch {
      setError("AI 建议生成失败");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSave = async () => {
    if (!draft?.anchor?.essence?.trim()) {
      setError("请至少填写锚点中的「概括」");
      return;
    }
    if (!draft?.anchor?.name?.trim()) {
      setError("请填写角色名称");
      return;
    }

    try {
      setError(null);
      await createCharacter.mutateAsync({
        character_data: draft,
        is_public: isPublic,
        image_path: imagePath || undefined,
        author_id: getCreatorId(),
      });
      draftManager.remove(CREATE_DRAFT_ID);
      reset();
      navigate(routes.characters.mine, { replace: true });
    } catch (err) {
      setError("保存失败");
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">创建角色</h1>
            <p className="mt-2 text-gray-500">由表及里，逐层刻画一个立体的角色</p>
          </div>
          <Button variant="secondary" loading={aiBusy} onClick={handleAiSuggest}>
            AI 填充六层建议
          </Button>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <CharacterEditor
          imagePath={imagePath}
          onImageChange={setImagePath}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
        />
      </div>

      <div className="flex items-center justify-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <Button
          variant="ghost"
          onClick={() => {
            draftManager.remove(CREATE_DRAFT_ID);
            reset();
            navigate(routes.characters.index);
          }}
        >
          取消
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            draftManager.remove(CREATE_DRAFT_ID);
            setDraft(emptyCharacterData);
            setImagePath("");
          }}
        >
          重置
        </Button>
        <Button onClick={handleSave} loading={createCharacter.isPending}>
          保存角色
        </Button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
