import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useCharacter, useUpdateCharacter } from "@/hooks/useCharacters";
import { useEditorStore } from "@/stores";
import { CharacterEditor } from "@/modules/character";
import { LoadingSpinner, ErrorDisplay, Button } from "@/components/ui";
import { routes } from "@/lib/routes";

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading, error } = useCharacter(id!);
  const updateCharacter = useUpdateCharacter();
  const { draft, setDraft, markClean } = useEditorStore();

  const [isPublic, setIsPublic] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (character) {
      setDraft(character.character_data, character.id);
      setIsPublic(character.is_public);
      setImagePath(character.image_path || "");
    }
  }, [character]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message="加载角色失败" />;
  if (!character || !draft) return <ErrorDisplay message="角色不存在" />;

  const handleSave = async () => {
    try {
      setSaveError(null);
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
      setSaveError("保存失败");
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in px-4 py-8 sm:px-6">
      <nav className="mb-6">
        <Link
          to={routes.characters.detail(character.id)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回角色详情
        </Link>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">编辑角色</h1>
        <p className="mt-2 text-gray-500">修改 {character.name} 的设定</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <CharacterEditor
          imagePath={imagePath}
          onImageChange={setImagePath}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
        />
      </div>

      <div className="flex items-center justify-end gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(routes.characters.detail(character.id))}
        >
          取消
        </Button>
        <Button onClick={handleSave} loading={updateCharacter.isPending}>
          保存更改
        </Button>
      </div>

      {saveError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {saveError}
        </div>
      )}
    </div>
  );
}
