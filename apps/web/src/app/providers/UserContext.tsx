import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { userApi, type UserProfile } from "@/shared/api/user";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import { CREATOR_ID_KEY, getCreatorId } from "@/shared/lib/creatorId";
import { PLAYER_TOKEN_KEY, getPlayerToken } from "@/shared/lib/playerToken";

interface UserContextValue {
  profile: UserProfile | null;
  loading: boolean;
  creatorId: string;
  playerToken: string;
  displayLabel: string;
  refresh: () => Promise<void>;
  bindEmail: (email: string) => Promise<void>;
  restoreFromEmail: (email: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  setAvatarEmoji: (emoji: string) => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const creatorId = useMemo(() => getCreatorId(), []);
  const playerToken = useMemo(() => getPlayerToken(), []);

  const refresh = useCallback(async () => {
    // 桌面壳目前无法指向后端（deployment.ts 既有判据），这个请求必然失败且过去一直
    // 被下面的 catch 静默吞掉——每个页面的首帧都在等它。本地态身份就是缺席，直接如实标注。
    if (isLocalOnlyDeployment()) {
      setProfile(null);
      return;
    }
    try {
      const p = await userApi.session({
        creator_id: getCreatorId(),
        player_token: getPlayerToken(),
      });
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const bindEmail = useCallback(
    async (email: string) => {
      const p = await userApi.updateProfile({
        creator_id: getCreatorId(),
        player_token: getPlayerToken(),
        email,
      });
      setProfile(p);
    },
    [],
  );

  const restoreFromEmail = useCallback(async (email: string) => {
    const { profiles } = await userApi.resolve(email);
    const hit = profiles[0];
    if (!hit) throw new Error("not found");
    localStorage.setItem(CREATOR_ID_KEY, hit.creator_id);
    localStorage.setItem(PLAYER_TOKEN_KEY, hit.player_token);
    setProfile(hit);
    window.location.reload();
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    const p = await userApi.updateProfile({
      creator_id: getCreatorId(),
      player_token: getPlayerToken(),
      display_name: name,
    });
    setProfile(p);
  }, []);

  const setAvatarEmoji = useCallback(async (emoji: string) => {
    const p = await userApi.updateProfile({
      creator_id: getCreatorId(),
      player_token: getPlayerToken(),
      avatar_emoji: emoji,
    });
    setProfile(p);
  }, []);

  const exportData = useCallback(async () => {
    const data = await userApi.exportData({
      creator_id: getCreatorId(),
      player_token: getPlayerToken(),
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axiforge-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const deleteAccount = useCallback(async () => {
    await userApi.deleteAccount({
      creator_id: getCreatorId(),
      player_token: getPlayerToken(),
    });
    localStorage.removeItem(CREATOR_ID_KEY);
    localStorage.removeItem(PLAYER_TOKEN_KEY);
    window.location.reload();
  }, []);

  const displayLabel =
    profile?.display_name ||
    profile?.email?.split("@")[0] ||
    `创作者 ${creatorId.slice(-6)}`;

  const value: UserContextValue = {
    profile,
    loading,
    creatorId,
    playerToken,
    displayLabel,
    refresh,
    bindEmail,
    restoreFromEmail,
    setDisplayName,
    setAvatarEmoji,
    exportData,
    deleteAccount,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
