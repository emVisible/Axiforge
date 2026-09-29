
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateProject } from "@/shared/hooks/useProjects";
import Shell from "@/shared/components/Shell";
import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { getCreatorId } from "@/shared/lib/creatorId";

const MECHANISMS = [
  "日常校园",
  "密室逃脱",
  "末日生存",
  "悬疑推理",
  "奇幻冒险",
  "星际探索",
  "宫廷权谋",
];
const GENRES = ["恋爱", "悬疑", "科幻", "奇幻", "历史", "恐怖", "喜剧", "正剧"];

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    /*
     * 用 mutate + onSuccess 而不是 await mutateAsync：后者原先没有 catch，
     * 失败只是一条未处理的 rejection，表单停在原地、用户不知道为什么不建。
     * 失败原因取 mutation 自己的 error——不再另存一份本地 state（同一语义一处权威）。
     */
    createProject.mutate(
      {
        title: title.trim(),
        description,
        mechanism: mechanism || undefined,
        genre: genre || undefined,
        theme_tags: tags,
        author_id: getCreatorId(),
      },
      { onSuccess: (project) => navigate(`/studio/projects/${project.id}`) },
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  return (
    <Shell variant="focus">
      <PageHeader title="创建剧本" />
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="剧本名称"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入剧本名称"
            />
            <Textarea
              label="描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="简要描述剧本内容..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="核心机制"
                value={mechanism}
                onChange={(e) => setMechanism(e.target.value)}
              >
                <option value="">选择机制...</option>
                {MECHANISMS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select
                label="题材"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="">选择题材...</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                主题标签
              </label>
              <div className="mb-2 flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.nativeEvent.isComposing &&
                    (e.preventDefault(), addTag())
                  }
                  placeholder="输入标签后按回车"
                  className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full bg-brand-muted px-2.5 py-1 text-xs text-brand"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {createProject.isError && (
              <p role="alert" className="text-sm text-danger">
                {createProject.error.message}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/studio/projects")}
              >
                取消
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "创建中..." : "创建剧本"}
              </Button>
            </div>
          </form>
        </Card>
    </Shell>
  );
}
