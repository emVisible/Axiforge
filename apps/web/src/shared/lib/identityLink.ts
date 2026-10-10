import { reportApi } from "@/shared/api/report";
import { identityApi } from "@/shared/api/identity";
import { userApi } from "@/shared/api/user";
import { CREATOR_ID_KEY, getCreatorId } from "@/shared/lib/creatorId";
import { PLAYER_TOKEN_KEY, getPlayerToken } from "@/shared/lib/playerToken";

export async function linkCreatorEmail(email: string) {
  const creator_id = getCreatorId();
  const player_token = getPlayerToken();
  await Promise.all([
    identityApi.linkEmail({ local_id: creator_id, email, kind: "creator" }),
    identityApi.linkEmail({ local_id: player_token, email, kind: "player" }),
    userApi.updateProfile({ creator_id, player_token, email }),
  ]);
}

export async function linkPlayerEmail(email: string) {
  return linkCreatorEmail(email);
}

export async function restoreIdentityFromEmail(email: string) {
  const { profiles } = await userApi.resolve(email);
  const hit = profiles[0];
  if (hit) {
    localStorage.setItem(CREATOR_ID_KEY, hit.creator_id);
    localStorage.setItem(PLAYER_TOKEN_KEY, hit.player_token);
    return [{ local_id: hit.creator_id, email, kind: "creator" as const }];
  }
  const { links } = await identityApi.resolve(email);
  for (const link of links) {
    if (link.kind === "creator") {
      localStorage.setItem(CREATOR_ID_KEY, link.local_id);
    }
    if (link.kind === "player") {
      localStorage.setItem(PLAYER_TOKEN_KEY, link.local_id);
    }
  }
  return links;
}

export async function reportContent(
  targetType: "project" | "character" | "asset",
  targetId: string,
  reason: string,
) {
  return reportApi.create({
    target_type: targetType,
    target_id: targetId,
    reason,
    reporter_token: getPlayerToken(),
  });
}
