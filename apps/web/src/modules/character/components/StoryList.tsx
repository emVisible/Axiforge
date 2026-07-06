import { Link, useParams } from "react-router";
import { BookOpen } from "lucide-react";
import { useStories, useDeleteStory } from "@/hooks/useStories";
import { Button } from "@/components/ui";
import { routes } from "@/lib/routes";

export default function StoryList() {
  const { id: characterId } = useParams<{ id: string }>();
  const { data: stories, isLoading } = useStories(characterId!);
  const deleteStory = useDeleteStory(characterId!);

  if (isLoading) return <p className="text-sm text-gray-400 py-4">加载中...</p>;

  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <BookOpen className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-gray-400 mb-5">还没有书写任何篇章</p>
        <Button
          size="sm"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-create-story"));
          }}
        >
          + 写第一篇传记
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stories.map((story) => (
        <div
          key={story.id}
          className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
        >
          <Link
            to={routes.characters.story(characterId!, story.id)}
            className="flex-1 min-w-0"
          >
            <h4 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
              {story.title}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {story.word_count} 字 ·{" "}
              {new Date(story.updated_at).toLocaleDateString()}
            </p>
          </Link>
          <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={routes.characters.storyEdit(characterId!, story.id)}
              className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1"
            >
              编辑
            </Link>
            <button
              onClick={() => {
                if (confirm(`删除「${story.title}」？`))
                  deleteStory.mutate(story.id);
              }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
