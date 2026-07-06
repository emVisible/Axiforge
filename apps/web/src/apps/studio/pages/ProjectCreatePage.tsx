
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateProject } from "@/hooks/useProjects";
import Shell from "@/components/Shell";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const project = await createProject.mutateAsync({
      title: title.trim(),
      description,
      mechanism: mechanism || undefined,
      genre: genre || undefined,
      theme_tags: tags,
    });
    navigate(`/studio/projects/${project.id}`);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">创建剧本</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              剧本名称 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] outline-none"
              placeholder="输入剧本名称"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] outline-none resize-none"
              placeholder="简要描述剧本内容..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                核心机制
              </label>
              <select
                value={mechanism}
                onChange={(e) => setMechanism(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] outline-none"
              >
                <option value="">选择机制...</option>
                {MECHANISMS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                题材
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] outline-none"
              >
                <option value="">选择题材...</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              主题标签
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  (e.preventDefault(), addTag())
                }
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b3473]/20 focus:border-[#3b3473] outline-none"
                placeholder="输入标签后按回车"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2.5 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-xs bg-[#3b3473]/10 text-[#3b3473] rounded-full flex items-center gap-1"
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/studio/projects")}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-6 py-2 text-sm bg-[#3b3473] text-white rounded-lg hover:bg-[#4a4380] disabled:opacity-50 transition-colors"
            >
              {createProject.isPending ? "创建中..." : "创建剧本"}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
