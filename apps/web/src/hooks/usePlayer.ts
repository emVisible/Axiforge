
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playerApi } from '@/api/player';
import type { StartSessionRequest, CompleteNodeRequest } from '@/types';

export const PLAYER_KEYS = {
  all: ['player'] as const,
  session: (id: string) => ['player', 'session', id] as const,
  draw: (id: string) => ['player', 'draw', id] as const,
  memories: (id: string) => ['player', 'memories', id] as const,
  flags: (id: string) => ['player', 'flags', id] as const,
  characters: (id: string) => ['player', 'characters', id] as const,
};

export const useStartSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartSessionRequest) => playerApi.startSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAYER_KEYS.all }),
  });
};

export const useSessionDraw = (sessionId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: PLAYER_KEYS.draw(sessionId),
    queryFn: () => playerApi.draw(sessionId),
    enabled: !!sessionId && enabled,
  });

export const useCompleteNode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: CompleteNodeRequest;
    }) => playerApi.complete(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: PLAYER_KEYS.draw(sessionId) });
      qc.invalidateQueries({ queryKey: PLAYER_KEYS.memories(sessionId) });
      qc.invalidateQueries({ queryKey: PLAYER_KEYS.flags(sessionId) });
      qc.invalidateQueries({ queryKey: PLAYER_KEYS.characters(sessionId) });
    },
  });
};

export const useSessionMemories = (sessionId: string) =>
  useQuery({
    queryKey: PLAYER_KEYS.memories(sessionId),
    queryFn: () => playerApi.getMemories(sessionId),
    enabled: !!sessionId,
  });

export const useSessionFlags = (sessionId: string) =>
  useQuery({
    queryKey: PLAYER_KEYS.flags(sessionId),
    queryFn: () => playerApi.getFlags(sessionId),
    enabled: !!sessionId,
  });

export const useSessionCharacterStates = (sessionId: string) =>
  useQuery({
    queryKey: PLAYER_KEYS.characters(sessionId),
    queryFn: () => playerApi.getCharacterStates(sessionId),
    enabled: !!sessionId,
  });