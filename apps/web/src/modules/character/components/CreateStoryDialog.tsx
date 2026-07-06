import { useState } from "react";
import { useCreateStory } from "@/hooks/useStories";
import { Button } from "@/components/ui";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/lib/routes";

interface CreateStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStoryDialog({ isOpen, onClose }: CreateStoryDialogProps) {
  const { id: characterId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createStory = useCreateStory(characterId!);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("请输入篇章标题"); return; }
    try {
      const story = await createStory.mutateAsync({ title: title.trim() });
      onClose();
      setTitle("");
      navigate(routes.characters.storyEdit(characterId!, story.id));
    } catch {
      setError("创建失败");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">新建篇章</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">篇章标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：第一章·起源"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} type="button">取消</Button>
            <Button type="submit" loading={createStory.isPending}>创建并编辑</Button>
          </div>
        </form>
      </div>
    </div>
  );
}