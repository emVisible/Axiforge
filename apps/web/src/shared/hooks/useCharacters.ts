import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterApi } from '@/shared/api/characters';
import { getPlayerToken } from '@/shared/lib/playerToken';
import { getStorageProvider, storedCharacterToResponse } from '@/shared/storage';
import { isTauriEnvironment } from '@/shared/storage/tauriSqlBackend';
import type { Character, CharacterCreate, CharacterUpdate, ForkRequest } from '@/shared/types/character';
import type { StoredCharacter } from '@axiforge/editor-core';

export const CHARACTER_KEYS = {
  all: ['characters'] as const,
  public: (params?: Record<string, any>) => ['characters', 'public', params] as const,
  detail: (id: string) => ['characters', 'detail', id] as const,
  user: (authorId: string) => ['characters', 'user', authorId] as const,
  forkChain: (id: string) => ['characters', 'forkChain', id] as const,
};

/**
 * 角色读写的运行环境分派（Blueprint v1.4 裁决）：
 * 桌面走 StorageProvider（本地 SQLite），浏览器保持既有 API 路径逐字不变——
 * 传输态字段（标签/血统/计数/时间戳）在本地并不存在，强行统一等于给 web 冻结线填假值。
 * 云端专属能力（公开库、Fork 链、删除）不在本文件分派，由缺席域降级层显式提示。
 */

function toStored(input: {
  id?: string;
  name: string;
  characterData: Character['character_data'] | Record<string, unknown>;
  imagePath?: string | null;
  isPublic?: boolean;
  authorId?: string | null;
}): StoredCharacter {
  return {
    id: input.id ?? '',
    name: input.name,
    characterData: input.characterData as Record<string, unknown>,
    imagePath: input.imagePath ?? null,
    isPublic: input.isPublic ?? false,
    authorId: input.authorId ?? null,
  };
}

const localNameOf = (data: Character['character_data'] | undefined): string =>
  (data as { anchor?: { name?: string } } | undefined)?.anchor?.name || '未命名';

export const usePublicCharacters = (params?: {
  skip?: number; limit?: number; search?: string; tags?: string; sort?: string;
}) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.public(params),
    queryFn: () => characterApi.listPublic(params),
  });
};

export const useUserCharacters = (authorId: string) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.user(authorId),
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const r = await p.listCharacters({ authorId });
        if (!r.ok) throw new Error(`角色清单读取失败：${r.error.code}`);
        return r.data.map(storedCharacterToResponse);
      }
      return characterApi.listUser(authorId);
    },
    enabled: !!authorId,
  });
};

export const useCharacter = (id: string, options?: { bumpView?: boolean }) => {
  return useQuery({
    queryKey: [...CHARACTER_KEYS.detail(id), options?.bumpView ?? false],
    queryFn: async () => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const r = await p.getCharacter(id);
        if (!r.ok) throw new Error(`角色读取失败：${r.error.code}`);
        return storedCharacterToResponse(r.data);
      }
      return characterApi.get(id, {
        bump_view: options?.bumpView,
        viewer_token: options?.bumpView ? getPlayerToken() : undefined,
      });
    },
    enabled: !!id,
  });
};

export const useCreateCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CharacterCreate): Promise<Character> => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const authorId = data.author_id ?? '';
        const r = await p.saveCharacter(
          toStored({
            name: localNameOf(data.character_data),
            characterData: data.character_data,
            imagePath: data.image_path,
            isPublic: data.is_public,
            authorId,
          }),
        );
        if (!r.ok) throw new Error(`角色创建失败：${r.error.code}`);
        const got = await p.getCharacter(r.data.id);
        if (!got.ok) throw new Error(`角色回读失败：${got.error.code}`);
        return storedCharacterToResponse(got.data);
      }
      return characterApi.create(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
      if (variables.author_id) {
        queryClient.invalidateQueries({
          queryKey: CHARACTER_KEYS.user(variables.author_id),
        });
      }
    },
  });
};

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CharacterUpdate }) => {
      if (isTauriEnvironment()) {
        const p = await getStorageProvider();
        const current = await p.getCharacter(id);
        if (!current.ok) throw new Error(`角色读取失败：${current.error.code}`);
        const merged = toStored({
          id,
          name:
            data.character_data !== undefined
              ? localNameOf(data.character_data)
              : current.data.name,
          characterData: data.character_data ?? current.data.characterData,
          imagePath:
            data.image_path === undefined ? current.data.imagePath : data.image_path,
          isPublic: data.is_public ?? current.data.isPublic,
          // 归属不随更新变更：CharacterUpdate 就没有 author_id 字段，云端同理不可改主
          authorId: current.data.authorId,
        });
        const saved = await p.saveCharacter(merged);
        if (!saved.ok) throw new Error(`角色保存失败：${saved.error.code}`);
        // 回读而非回显：与 web 端「以服务端返回为准」的语义一致
        const got = await p.getCharacter(id);
        if (!got.ok) throw new Error(`角色回读失败：${got.error.code}`);
        return storedCharacterToResponse(got.data);
      }
      return characterApi.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['characters', 'public'] });
    },
  });
};

export const useDeleteCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => characterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
    },
  });
};

export const useForkCharacter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, forkRequest }: { id: string; forkRequest?: ForkRequest }) =>
      characterApi.fork(id, forkRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARACTER_KEYS.all });
    },
  });
};

export const useForkChain = (id: string) => {
  return useQuery({
    queryKey: CHARACTER_KEYS.forkChain(id),
    queryFn: () => characterApi.getForkChain(id),
    enabled: !!id,
  });
};
