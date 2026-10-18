import { useQuery } from "@tanstack/react-query";
import { adminApi, type ModerationVocabulary } from "@/api/adminClient";
import { adminQueryKeys } from "@/hooks/adminQueryKeys";
import { EMPTY_VOCABULARY } from "@/lib/moderation";

/**
 * 判断层词汇表：条款 / 规则 / 结论的中文短名全部来自后端那一处定义。
 *
 * 两个页面共用同一个 queryKey，React Query 把它们合成一次请求。
 * 没取到之前返回空表，标签函数会落回内部 id——**这不是兜底文案，是可见的缺口**：
 * 词表接口挂了，运营看到的是 `spam_promotion` 而不是一句假装成功的"导流垃圾"。
 */
export function useModerationVocabulary(): ModerationVocabulary {
  const { data } = useQuery({
    queryKey: adminQueryKeys.moderationVocabulary,
    queryFn: adminApi.moderationVocabulary,
    staleTime: 600_000,
  });
  return data ?? EMPTY_VOCABULARY;
}
