import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { nexusApi, type NexusNote } from "@/services/api";
import { mergeNotesLWW, readCachedNotes, writeCachedNotes } from "@/lib/noteCache";

export const NEXUS_NOTES_KEY = "nexus-notes";

async function fetchAndMergeNotes(authorId: string): Promise<NexusNote[]> {
  const remote = await nexusApi.list(authorId);
  const cached = await readCachedNotes(authorId);
  const merged = cached ? mergeNotesLWW(cached, remote) : remote;
  await writeCachedNotes(authorId, merged);
  return merged;
}

export function useNexusNotes(authorId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    void readCachedNotes(authorId).then((cached) => {
      if (cancelled || !cached?.length) return;
      qc.setQueryData<NexusNote[]>([NEXUS_NOTES_KEY, authorId], cached);
    });
    return () => {
      cancelled = true;
    };
  }, [authorId, qc]);

  return useQuery({
    queryKey: [NEXUS_NOTES_KEY, authorId],
    queryFn: () => fetchAndMergeNotes(authorId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export async function invalidateNexusNotes(qc: ReturnType<typeof useQueryClient>) {
  await qc.invalidateQueries({ queryKey: [NEXUS_NOTES_KEY] });
}
