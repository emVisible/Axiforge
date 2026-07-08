import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useCharacter, useUpdateCharacter } from "@/shared/hooks/useCharacters";
import { useEditorStore } from "@/shared/stores";
import { CharacterEditor } from "@/features/character";
import {
  BackLink,
  Button,
  Card,
  ErrorDisplay,
  LoadingSpinner,
  PageHeader,
} from "@/shared/components/ui";
import Shell from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { routes } from "@/shared/lib/routes";

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading, error } = useCharacter(id!);
  const updateCharacter = useUpdateCharacter();
  const { draft, setDraft, markClean } = useEditorStore();

  const [isPublic, setIsPublic] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (character) {
      setDraft(character.character_data, character.id);
      setIsPublic(character.is_public);
      setImagePath(character.image_path || "");
    }
  }, [character, setDraft]);

  if (isLoading) {
    return (
      <Shell narrow>
        <LoadingSpinner />
      </Shell>
    );
  }
  if (error) return <ErrorDisplay message="加载角色失败" />;
  if (!character || !draft) return <ErrorDisplay message="角色不存在" />;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async () => {
    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        data: {
          character_data: draft,
          is_public: isPublic,
          image_path: imagePath || undefined,
        },
      });
      markClean();
      navigate(routes.characters.detail(character.id), { replace: true });
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

      <BackLink to={routes.characters.detail(character.id)}>返回角色详情</BackLink>

      <PageHeader
        title="编辑角色"
        description={`修改 ${character.name} 的设定`}
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
          onClick={() => navigate(routes.characters.detail(character.id))}
        >
          取消
        </Button>
        <Button onClick={handleSave} loading={updateCharacter.isPending}>
          保存更改
        </Button>
      </Card>
    </Shell>
  );
}
