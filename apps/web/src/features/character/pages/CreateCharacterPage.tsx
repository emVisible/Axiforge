import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useEditorStore, emptyCharacterData } from "@/shared/stores";
import { useCreateCharacter } from "@/shared/hooks/useCharacters";
import { CharacterEditor } from "@/features/character";
import {
  BackLink,
  Button,
  Card,
  PageHeader,
} from "@/shared/components/ui";
import Shell from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { draftManager, CREATE_DRAFT_ID } from "@/shared/lib/draftManager";
import DraftRestoreDialog from "@/shared/components/ui/DraftRestoreDialog";
import { routes } from "@/shared/lib/routes";
import { getCreatorId } from "@/shared/lib/creatorId";
import { aiApi } from "@/shared/api/ai";
import LlmStatusBadge from "@/shared/components/LlmStatusBadge";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

export default function CreateCharacterPage() {
  const navigate = useNavigate();
  const { draft, setDraft, reset } = useEditorStore();
  const createCharacter = useCreateCharacter();

  const [isPublic, setIsPublic] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSource, setAiSource] = useState<string | undefined>();
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

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
    /*
     * 建档建议依赖服务端的模型通路（`/editor/ai/suggest-character` + Python provider 链）。
     * 本地这条还不存在：`packages/axs/prompts/` 目前只有一份 `prose-to-axs.json`，
     * 没有建档提示词，所以这不是"接一下线"就能本地化的，是要新做一项能力（ADR-029 未决项）。
     * 放在名称校验之前：桌面版根本没有这个能力，先让用户填一个不会送去任何地方的名字才是误导。
     */
    if (isLocalOnlyDeployment()) {
      showToast("桌面版还没有本地建档建议通路（缺一份建档提示词），此项仍依赖服务端模型", "error");
      return;
    }
    if (!draft.anchor?.name?.trim()) {
      showToast("请先填写角色名称", "error");
      return;
    }
    setAiBusy(true);
    try {
      const res = await aiApi.suggestCharacter({
        name: draft.anchor.name,
        essence: draft.anchor.essence || "",
        tags: draft.anchor.tags || [],
        author_id: getCreatorId(),
      });
      setAiSource(res.source);
      setDraft({
        ...draft,
        anchor: { ...draft.anchor, ...res.layers.anchor },
        contour: { ...draft.contour, ...res.layers.contour },
        demeanor: { ...draft.demeanor, ...res.layers.demeanor },
        psyche: { ...draft.psyche, ...res.layers.psyche },
        trace: { ...draft.trace, ...res.layers.trace },
        bond: { ...draft.bond, ...res.layers.bond },
      });
      showToast(`AI 建议已填入（${res.source}）`);
    } catch {
      showToast("AI 建议生成失败", "error");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSave = async () => {
    if (!draft?.anchor?.essence?.trim()) {
      showToast("请至少填写锚点中的「概括」", "error");
      return;
    }
    if (!draft?.anchor?.name?.trim()) {
      showToast("请填写角色名称", "error");
      return;
    }

    try {
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
      showToast("保存失败", "error");
      console.error(err);
    }
  };

  return (
    <Shell narrow>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BackLink to={routes.characters.mine}>我的角色</BackLink>

      <PageHeader
        title="创建角色"
        description="由表及里，逐层刻画一个立体的角色"
        action={
          <div className="flex items-center gap-2">
            <LlmStatusBadge lastSource={aiSource} />
            <Button variant="secondary" size="sm" loading={aiBusy} onClick={handleAiSuggest}>
              AI 填充六层建议
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CharacterEditor
          imagePath={imagePath}
          onImageChange={setImagePath}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
        />
      </Card>

      <Card className="flex flex-wrap items-center justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            draftManager.remove(CREATE_DRAFT_ID);
            reset();
            navigate(routes.characters.mine);
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
      </Card>
    </Shell>
  );
}
