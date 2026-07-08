import { useState } from "react";
import { useCreateStory } from "@/shared/hooks/useStories";
import { Input, Modal, ModalActions } from "@/shared/components/ui";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/shared/lib/routes";

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请输入篇章标题");
      return;
    }
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
    <Modal
      open={isOpen}
      onClose={onClose}
      title="新建篇章"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleSubmit()}
          confirmLabel="创建并编辑"
          loading={createStory.isPending}
          disabled={!title.trim()}
        />
      }
    >
      <div className="space-y-4">
        <Input
          label="篇章标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：第一章·起源"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
