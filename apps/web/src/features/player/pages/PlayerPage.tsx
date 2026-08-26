
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import { loadStoryOffline } from "@/shared/storage";
import { useParams, Link } from "react-router";
import {
  Anchor,
  BookOpen,
  Circle,
  Clock,
  GitBranch,
  Image as ImageIcon,
  Menu,
  Pause,
  Play,
  Save,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  start as engineStart,
  proceed as engineProceed,
  choose as engineChoose,
  restore as engineRestore,
  type StoryPackage,
  type RuntimeState,
  type StoryView,
} from "@axiforge/core";
import { ginkgoApi } from "@/shared/api/ginkgo";
import { playerApi, type SaveSlotResponse, stateForSave } from "@/shared/api/player";
import { getPlayerToken } from "@/shared/lib/playerToken";
import { projectApi } from "@/shared/api/editor";
import type { CodexLedger } from "@axiforge/core";
import { getCreatorId } from "@/shared/lib/creatorId";
import {
  loadPlayerSettings,
  savePlayerSettings,
  type PlayerSettings,
} from "@/shared/lib/playerSettings";
import {
  loadUnlocks,
  unlockCg,
  unlockBgm,
  type PlayerUnlocks,
} from "@/shared/lib/playerUnlocks";
import {
  lineKey,
  isLineRead,
  markLineRead,
} from "@/shared/lib/playerReadState";
import { expressionLabel } from "@/shared/lib/expressions";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import {
  type Stage,
  EMPTY_STAGE,
  foldStage,
  extractOneShots,
} from "../lib/stage";
import { renderRich, stripRich } from "../lib/richText";
import FxLayer from "../components/FxLayer";
import BacklogPanel, { type BacklogEntry } from "../components/BacklogPanel";
import SettingsPanel from "../components/SettingsPanel";
import SaveSlotPanel, { AUTO_SAVE_SLOT } from "../components/SaveSlotPanel";
import GalleryPanel from "../components/GalleryPanel";
import CodexPanel, { TermTipPopover } from "../components/CodexPanel";
import RouteReplayPanel from "../components/RouteReplayPanel";
import TimelinePanel from "../components/TimelinePanel";
import { playerTheme, playerScreenClass } from "@/shared/lib/playerTheme";
import PlayerHudBrand from "@/shared/components/PlayerHudBrand";
import UserAccountMenu from "@/shared/components/UserAccountMenu";
import { LoadingSpinner } from "@/shared/components/ui";
import {
  loadRouteHistory,
  recordChoice,
  recordEnding,
  type RouteHistory,
} from "@/shared/lib/routeHistory";

const POSITION_CLASS: Record<string, string> = {
  left: "left-[18%] -translate-x-1/2",
  center: "left-1/2 -translate-x-1/2",
  right: "right-[18%] translate-x-1/2",
};

type Overlay =
  | null
  | "menu"
  | "save"
  | "load"
  | "settings"
  | "backlog"
  | "gallery"
  | "codex"
  | "route"
  | "timeline";

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

/** 从视图构造存档摘要（列表页/续玩提示用） */
function buildSummary(v: StoryView | null): string {
  if (!v) return "";
  if (v.waiting === "say" && v.line?.text) {
    const t = stripRich(v.line.text);
    const s = v.line.speaker ? `${v.line.speaker}：${t}` : t;
    return s.slice(0, 120);
  }
  if (v.waiting === "choice") return "（等待选择）";
  if (v.waiting === "end") return "（已结束）";
  return "";
}

// ============================================================
// VN Player —— @axiforge/core IR 渲染器（ADR-008）
// ============================================================

export default function PlayerPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [pkg, setPkg] = useState<StoryPackage | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [loadError, setLoadError] = useState<"private" | "generic">("generic");
  const playerToken = useMemo(() => getPlayerToken(), []);
  // 存在可续玩存档时先展示"继续/重新开始"选择，不立即开播
  const [saveOffer, setSaveOffer] = useState<SaveSlotResponse | null>(null);

  const [rtState, setRtState] = useState<RuntimeState | null>(null);
  const [view, setView] = useState<StoryView | null>(null);
  const [stage, setStage] = useState<Stage>(EMPTY_STAGE);
  const [backlog, setBacklog] = useState<BacklogEntry[]>([]);

  const [settings, setSettings] = useState<PlayerSettings>(() =>
    projectId ? loadPlayerSettings(projectId) : loadPlayerSettings(""),
  );
  const [unlocks, setUnlocks] = useState<PlayerUnlocks>(() =>
    projectId ? loadUnlocks(projectId) : { cgs: [], bgms: [] },
  );
  const [achievementToast, setAchievementToast] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [galleryTab, setGalleryTab] = useState<"cg" | "music">("cg");
  const [saveSlots, setSaveSlots] = useState<SaveSlotResponse[]>([]);
  const [activeTerm, setActiveTerm] = useState<{
    term: string;
    definition: string;
  } | null>(null);
  const [routeHistory, setRouteHistory] = useState<RouteHistory>(() =>
    projectId ? loadRouteHistory(projectId) : { choices: [], endings: [] },
  );

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [textComplete, setTextComplete] = useState(false);

  const [showStatePanel, setShowStatePanel] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const containerRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<Stage>(EMPTY_STAGE);
  stageRef.current = stage;

  // ---------- 音频（bgm 循环 + se/voice 一次性）----------
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmTrackRef = useRef<string | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const playOneShot = useCallback((url: string, volume?: number) => {
    const src = getImageUrl(url);
    if (!src) return;
    const vol = volume ?? settingsRef.current.seVolume;
    try {
      const a = new Audio(src);
      a.volume = vol;
      void a.play().catch(() => {});
    } catch {
      /* 资产缺失时静默 */
    }
  }, []);

  const syncBgm = useCallback((track: string | null) => {
    if (track === bgmTrackRef.current) return;
    bgmTrackRef.current = track;
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
    const src = getImageUrl(track || undefined);
    if (!src) return;
    try {
      const a = new Audio(src);
      a.loop = true;
      a.volume = settingsRef.current.bgmVolume;
      void a.play().catch(() => {});
      bgmRef.current = a;
    } catch {
      /* 忽略 */
    }
  }, []);

  const playOneShotsFromDirectives = useCallback(
    (v: StoryView) => {
      const { se, voice } = extractOneShots(v.directives);
      se.forEach((s) => playOneShot(s));
      if (voice !== null) {
        if (voiceRef.current) voiceRef.current.pause();
        const src = getImageUrl(voice || undefined);
        if (src) {
          try {
            const a = new Audio(src);
            a.volume = settingsRef.current.voiceVolume;
            void a.play().catch(() => {});
            voiceRef.current = a;
          } catch {
            /* 忽略 */
          }
        }
      }
      if (v.waiting === "say" && v.line?.voice)
        playOneShot(v.line.voice, settingsRef.current.voiceVolume);
    },
    [playOneShot],
  );

  // 音量设置变更时同步到正在播放的 BGM
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.volume = settings.bgmVolume;
  }, [settings.bgmVolume]);

  useEffect(() => {
    if (projectId) savePlayerSettings(projectId, settings);
  }, [projectId, settings]);

  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
      voiceRef.current?.pause();
    };
  }, []);

  // 记录当前 say 行到回顾
  const pushBacklog = useCallback((v: StoryView | null) => {
    if (v?.waiting === "say" && v.line?.text) {
      const text = stripRich(v.line.text);
      setBacklog((prev) => [
        ...prev,
        {
          speaker: v.line!.speaker ?? null,
          text,
          voice: v.line!.voice ?? null,
        },
      ]);
    }
  }, []);

  const trackUnlocks = useCallback(
    (next: Stage) => {
      if (!projectId) return;
      if (next.background) {
        const u = unlockCg(projectId, next.background);
        setUnlocks(u);
      }
      if (next.bgm) {
        const u = unlockBgm(projectId, next.bgm);
        setUnlocks(u);
      }
    },
    [projectId],
  );

  const showAchievementUnlocks = useCallback((v: StoryView, pid: string) => {
    const list = v.newlyUnlockedAchievements;
    if (!list?.length) return;
    const first = list[0];
    setAchievementToast({
      title: first.title,
      description: first.description,
    });
    const token = getPlayerToken();
    for (const a of list) {
      ginkgoApi.unlock(pid, token, a.key).catch(() => {});
    }
    window.setTimeout(() => setAchievementToast(null), 4000);
  }, []);

  // 应用一帧：折叠演出指令进舞台 + 触发音频
  const applyView = useCallback(
    (v: StoryView) => {
      const next = foldStage(stageRef.current, v.directives);
      setStage(next);
      trackUnlocks(next);
      syncBgm(next.bgm);
      playOneShotsFromDirectives(v);
      setView(v);
      if (projectId) showAchievementUnlocks(v, projectId);
    },
    [syncBgm, playOneShotsFromDirectives, trackUnlocks, projectId, showAchievementUnlocks],
  );

  const codexSyncRef = useRef<string>("{}");

  // ---------- 加载并启动 ----------
  const fetchCodex = useCallback(
    async (scope?: string[]) => {
      try {
        const res = await playerApi.getCodex(playerToken, scope);
        codexSyncRef.current = JSON.stringify(res.ledger ?? {});
        return res.ledger ?? {};
      } catch {
        return {} as CodexLedger;
      }
    },
    [playerToken],
  );

  const beginStory = useCallback(
    (p: StoryPackage, codex: CodexLedger = {}) => {
      setBacklog([]);
      const { state, view: v } = engineStart(p, { codex });
      const next = foldStage(EMPTY_STAGE, v.directives);
      setRtState(state);
      setStage(next);
      trackUnlocks(next);
      syncBgm(next.bgm);
      playOneShotsFromDirectives(v);
      setView(v);
    },
    [syncBgm, playOneShotsFromDirectives, trackUnlocks],
  );

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setStatus("loading");
      projectApi.recordView(projectId, playerToken).catch(() => {});
      // 桌面（Tauri）：Provider 数据本地编译，断网可玩；浏览器：后端编译
      const story = isTauriEnvironment()
        ? await loadStoryOffline(projectId)
        : await playerApi.getStory(projectId, getCreatorId());
      setPkg(story);
      const codex = await fetchCodex(story.codexScope);
      // 有可续玩的存档 → 先给出选择，不自动开播
      try {
        const save = await playerApi.getSave(projectId, playerToken);
        if (save?.state?.status === "active" && save.state.currentBeatId) {
          setSaveOffer(save);
          setStatus("ready");
          return;
        }
      } catch {
        // 无存档，忽略
      }
      beginStory(story, codex);
      setStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setLoadError(msg.includes("403") ? "private" : "generic");
      setStatus("error");
    }
  }, [projectId, beginStory, playerToken, fetchCodex]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  // ---------- 续玩 / 重新开始 ----------
  const continueSaved = useCallback(async () => {
    if (!pkg || !saveOffer) return;
    const codex = await fetchCodex(pkg.codexScope);
    const { state, view: v } = engineRestore(pkg, {
      ...saveOffer.state,
      codex,
    });
    const next = foldStage(EMPTY_STAGE, v.directives);
    setRtState(state);
    setStage(next);
    syncBgm(next.bgm);
    setView(v);
    setBacklog([]);
    setSaveOffer(null);
  }, [pkg, saveOffer, syncBgm, fetchCodex]);

  const restartFresh = useCallback(async () => {
    if (!pkg) return;
    setSaveOffer(null);
    const codex = await fetchCodex(pkg.codexScope);
    beginStory(pkg, codex);
    if (projectId) playerApi.clearSave(projectId, playerToken).catch(() => {});
  }, [pkg, beginStory, projectId, playerToken, fetchCodex]);

  // Codex 独立同步（跨作品记忆不落存档槽）
  useEffect(() => {
    if (!projectId || !rtState?.codex || saveOffer) return;
    const json = JSON.stringify(rtState.codex);
    if (json === codexSyncRef.current) return;
    const t = setTimeout(() => {
      codexSyncRef.current = json;
      playerApi
        .putCodex({
          player_token: playerToken,
          ledger: rtState.codex,
          source_project_id: projectId,
        })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [rtState?.codex, projectId, playerToken, saveOffer]);

  // ---------- 单槽自动存档（slot 0）+ 缩略图 ----------
  useEffect(() => {
    if (!projectId || !rtState || !pkg || saveOffer) return;
    const beat = pkg.beats.find((b) => b.id === rtState.currentBeatId);
    const thumbPath =
      stage.background ||
      pkg.scenes.find((s) => s.id === beat?.sceneId)?.backgroundImage ||
      null;
    const t = setTimeout(() => {
      if (rtState.status === "ended") {
        playerApi.clearSave(projectId, playerToken, AUTO_SAVE_SLOT).catch(() => {});
      } else {
        playerApi
          .putSave(projectId, {
            player_token: playerToken,
            state: stateForSave(rtState),
            summary: buildSummary(view),
            beat_id: rtState.currentBeatId,
            thumb_path: thumbPath,
            slot: AUTO_SAVE_SLOT,
          })
          .catch(() => {});
      }
    }, 600);
    return () => clearTimeout(t);
  }, [rtState, view, projectId, playerToken, saveOffer, stage.background, pkg]);

  // ---------- 推进 / 选择 ----------
  const doProceed = useCallback(() => {
    if (!pkg || !rtState || !view) return;
    if (view.waiting === "end") return;
    pushBacklog(view);
    const { state, view: v } = engineProceed(pkg, rtState);
    setRtState(state);
    applyView(v);
  }, [pkg, rtState, view, pushBacklog, applyView]);

  const doChoose = useCallback(
    (index: number) => {
      if (!pkg || !rtState || !view || view.waiting !== "choice") return;
      const choice = view.choices?.[index];
      if (!choice || choice.disabled) return;
      setBacklog((prev) => [...prev, { speaker: null, text: `→ ${choice.label}` }]);
      if (projectId) {
        setRouteHistory(
          recordChoice(projectId, rtState.currentBeatId ?? "?", choice.label),
        );
      }
      const { state, view: v } = engineChoose(pkg, rtState, index);
      setRtState(state);
      applyView(v);
    },
    [pkg, rtState, view, applyView, projectId],
  );

  // ---------- 打字机 + 跳过已读 ----------
  const currentLineKey = useMemo(() => {
    if (!rtState || view?.waiting !== "say") return null;
    return lineKey(rtState.currentBeatId, rtState.cursor);
  }, [rtState, view]);

  useEffect(() => {
    if (!view || view.waiting !== "say" || !view.line?.text || !projectId) {
      setDisplayedText("");
      setIsTyping(false);
      setTextComplete(true);
      return;
    }
    const fullText = view.line.text;
    const skip =
      settings.skipRead &&
      currentLineKey &&
      isLineRead(projectId, currentLineKey);

    if (view.line.rich || skip) {
      setDisplayedText(fullText);
      setIsTyping(false);
      setTextComplete(true);
      if (currentLineKey) markLineRead(projectId, currentLineKey);
      return;
    }
    setIsTyping(true);
    setTextComplete(false);
    setDisplayedText("");
    let i = 0;
    const speed = settings.textSpeedMs;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
        setTextComplete(true);
        if (currentLineKey) markLineRead(projectId, currentLineKey);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [view, settings.textSpeedMs, settings.skipRead, projectId, currentLineKey]);

  // ---------- wait 指令：自动推进 ----------
  useEffect(() => {
    if (view?.waiting === "wait") {
      const t = setTimeout(() => doProceed(), view.waitMs ?? 500);
      return () => clearTimeout(t);
    }
  }, [view, doProceed]);

  // ---------- 自动模式 ----------
  useEffect(() => {
    if (autoMode && textComplete && !isTyping && view?.waiting === "say") {
      autoTimerRef.current = setTimeout(() => doProceed(), settings.autoDelayMs);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [autoMode, textComplete, isTyping, view, doProceed, settings.autoDelayMs]);

  // ---------- 全屏 ----------
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ---------- 点击 / 键盘 ----------
  const onAdvanceClick = useCallback(() => {
    if (isTyping && view?.line?.text) {
      setDisplayedText(view.line.text);
      setIsTyping(false);
      setTextComplete(true);
      return;
    }
    if (view?.waiting === "say") doProceed();
  }, [isTyping, view, doProceed]);

  // ---------- 存档 / 菜单 ----------
  const refreshSaveSlots = useCallback(async () => {
    if (!projectId) return;
    try {
      const list = await playerApi.listSaves(projectId, playerToken);
      setSaveSlots(list);
    } catch {
      setSaveSlots([]);
    }
  }, [projectId, playerToken]);

  const openOverlay = useCallback(
    async (next: Overlay) => {
      if (next === "save" || next === "load") await refreshSaveSlots();
      setOverlay(next);
      setShowStatePanel(false);
    },
    [refreshSaveSlots],
  );

  const manualSave = useCallback(
    async (slot: number) => {
      if (!projectId || !rtState || !pkg) return;
      const beat = pkg.beats.find((b) => b.id === rtState.currentBeatId);
      const thumb =
        stage.background ||
        pkg.scenes.find((s) => s.id === beat?.sceneId)?.backgroundImage ||
        null;
      await playerApi.putSave(projectId, {
        player_token: playerToken,
        state: stateForSave(rtState),
        summary: buildSummary(view),
        beat_id: rtState.currentBeatId,
        thumb_path: thumb,
        slot,
      });
      setOverlay(null);
    },
    [projectId, rtState, pkg, stage.background, playerToken, view],
  );

  const manualLoad = useCallback(
    async (slot: number) => {
      const save = saveSlots.find((s) => s.slot === slot);
      if (!pkg || !save) return;
      const codex = await fetchCodex(pkg.codexScope);
      const { state, view: v } = engineRestore(pkg, {
        ...save.state,
        codex,
      });
      const next = foldStage(EMPTY_STAGE, v.directives);
      setRtState(state);
      setStage(next);
      trackUnlocks(next);
      syncBgm(next.bgm);
      setView(v);
      setBacklog([]);
      setOverlay(null);
      setSaveOffer(null);
    },
    [pkg, saveSlots, trackUnlocks, syncBgm, fetchCodex],
  );

  const deleteSaveSlot = useCallback(
    async (slot: number) => {
      if (!projectId) return;
      await playerApi.clearSave(projectId, playerToken, slot);
      await refreshSaveSlots();
    },
    [projectId, playerToken, refreshSaveSlots],
  );

  const replayVoice = useCallback(
    (url: string) => playOneShot(url, settingsRef.current.voiceVolume),
    [playOneShot],
  );

  const glossaryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of pkg?.glossary ?? []) m.set(g.term, g.definition);
    return m;
  }, [pkg]);

  const onTermClick = useCallback(
    (term: string) => {
      const def = glossaryMap.get(term);
      if (def) setActiveTerm({ term, definition: def });
    },
    [glossaryMap],
  );

  const richOpts = useMemo(() => ({ onTermClick }), [onTermClick]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (overlay) {
        if (e.key === "Escape") setOverlay(null);
        return;
      }
      if (showStatePanel) return;
      if (e.key === "Escape") {
        e.preventDefault();
        openOverlay("menu");
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onAdvanceClick();
      }
      if (e.key >= "1" && e.key <= "9" && view?.waiting === "choice") {
        const idx = parseInt(e.key) - 1;
        doChoose(idx);
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setAutoMode((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay, showStatePanel, onAdvanceClick, view, doChoose, toggleFullscreen, openOverlay]);

  const charById = useMemo(() => {
    const map: Record<
      string,
      { name: string; imagePath?: string | null; expressions?: Record<string, string> | null }
    > = {};
    for (const c of pkg?.characters ?? [])
      map[c.id] = { name: c.name, imagePath: c.imagePath, expressions: c.expressions };
    return map;
  }, [pkg]);

  // 表情差分选图：expressions[expr] 命中则用差分，否则回退到主立绘
  const resolveSprite = useCallback(
    (charId: string, expression?: string): string | undefined => {
      const c = charById[charId];
      if (!c) return undefined;
      const fromExpr =
        expression && c.expressions ? c.expressions[expression] : undefined;
      return getImageUrl(fromExpr || c.imagePath || undefined) || undefined;
    },
    [charById],
  );

  const currentBeat = useMemo(
    () => pkg?.beats.find((b) => b.id === view?.beatId) ?? null,
    [pkg, view],
  );
  const currentScene = useMemo(
    () => pkg?.scenes.find((s) => s.id === currentBeat?.sceneId) ?? null,
    [pkg, currentBeat],
  );

  // 到达结局时记录已达成结局（分支回想用）
  useEffect(() => {
    if (view?.waiting !== "end" || !projectId) return;
    const endedBeat = rtState?.completedBeats?.length
      ? pkg?.beats.find(
          (b) =>
            b.isEnding &&
            rtState.completedBeats.includes(b.id),
        )
      : null;
    const label = endedBeat?.endingLabel || "结局";
    setRouteHistory(recordEnding(projectId, label));
  }, [view?.waiting, projectId, rtState, pkg]);

  const backgroundImage = stage.background
    ? getImageUrl(stage.background)
    : getImageUrl(currentScene?.backgroundImage || undefined);

  const memEntries = Object.entries(rtState?.vars.memory ?? {});
  const flagEntries = Object.entries(rtState?.vars.flags ?? {});
  const charEntries = Object.entries(rtState?.vars.characters ?? {});
  const stateCount = memEntries.length + flagEntries.length;

  const line = view?.waiting === "say" ? view.line : undefined;
  const isNarration = !!line && !line.speaker;
  const isDialogue = !!line && !!line.speaker;
  const showChoices = view?.waiting === "choice";
  const isEnd = view?.waiting === "end";
  const isWaiting = view?.waiting === "wait";

  const speakerId = line?.characterId ?? null;
  const speakerExpression = speakerId ? stage.sprites[speakerId]?.expression : undefined;

  // 镜头变换（缩放/平移），UI 层不受影响
  const cameraStyle = {
    transform: `scale(${stage.camera.scale}) translate(${stage.camera.x}%, ${stage.camera.y}%)`,
    transition: "transform 300ms ease-out",
  } as const;
  // 在场立绘（show/hide/move 折叠结果）
  const onStageSprites = Object.entries(stage.sprites);

  // ================================================================
  // 渲染
  // ================================================================
  if (status === "loading") {
    return (
      <div className={`${playerScreenClass} flex items-center justify-center`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${playerScreenClass} flex items-center justify-center`}>
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-white/60">
            {loadError === "private"
              ? "该剧本尚未公开，或你没有访问权限"
              : "加载失败"}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            {loadError !== "private" && (
              <button
                onClick={() => load()}
                className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm"
              >
                重试
              </button>
            )}
            <Link
              to={routes.discover}
              className="px-6 py-2.5 border border-white/10 text-white/50 rounded-xl hover:border-white/30 hover:text-white/70 text-sm"
            >
              去发现更多作品
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 存档续玩选择
  if (saveOffer) {
    return (
      <div className={`${playerScreenClass} flex items-center justify-center`}>
        <div className="w-full max-w-md space-y-6 px-8 text-center animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40">
            <ScrollText className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-light tracking-wider text-white/80">
              {pkg?.title || "发现存档"}
            </h1>
            <p className="text-sm text-white/30">
              角色还记得你上次的选择
            </p>
          </div>
          {saveOffer.summary && (
            <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
              {saveOffer.summary}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={continueSaved}
              className="rounded-xl bg-white/10 px-6 py-3 text-sm tracking-wider text-white/80 hover:bg-white/20"
            >
              继续游玩
            </button>
            <button
              onClick={restartFresh}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white/40 hover:border-white/30 hover:text-white/60"
            >
              从头开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 空剧本
  if (!view || (!line && !showChoices && !isEnd && !isWaiting)) {
    return (
      <div className={`${playerScreenClass} flex items-center justify-center`}>
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/30">
            <ScrollText className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-white/60 text-xl font-light">暂无内容</h1>
          <p className="text-white/20 text-sm">该剧本还没有可播放的演出</p>
          <Link
            to={routes.project(projectId!)}
            className="inline-block rounded-xl bg-white/10 px-6 py-2.5 text-sm text-white/60 hover:bg-white/20"
          >
            前往编辑器
          </Link>
        </div>
      </div>
    );
  }

  if (isEnd) {
    const endingLabel =
      currentBeat?.endingLabel ||
      routeHistory.endings[routeHistory.endings.length - 1] ||
      null;
    return (
      <div className={`${playerScreenClass} flex items-center justify-center`}>
        <div className="text-center space-y-8 animate-fade-in px-6">
          <Circle className="mx-auto h-16 w-16 text-white/20" strokeWidth={1} />
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-[0.3em] text-white/80">终</h1>
            {endingLabel && (
              <p className="text-sm tracking-wider text-white/50">{endingLabel}</p>
            )}
          </div>
          <p className="text-white/30 text-sm">故事已结束</p>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <button
              onClick={restartFresh}
              className="px-8 py-3 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 text-sm tracking-wider"
            >
              重新开始
            </button>
            <button
              type="button"
              onClick={() => setOverlay("route")}
              className="px-8 py-3 border border-white/10 text-white/50 rounded-xl hover:border-white/30 hover:text-white/70 text-sm"
            >
              分支回想
            </button>
            <Link
              to={routes.discover}
              className="px-8 py-3 border border-white/10 text-white/40 rounded-xl hover:border-white/30 hover:text-white/60 text-sm"
            >
              发现更多
            </Link>
          </div>
          {overlay === "route" && (
            <RouteReplayPanel
              history={routeHistory}
              onClose={() => setOverlay(null)}
            />
          )}
        </div>
      </div>
    );
  }

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(10,10,20,0.55) 0%, rgba(10,10,20,0.75) 45%, rgba(20,20,40,0.92) 100%), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: playerTheme.stage,
      }
    : {
        backgroundImage: playerTheme.gradient,
        backgroundColor: playerTheme.stage,
      };

  // 展示立绘：以在场立绘为准；若说话者未在场则临时补一张居中立绘
  const displaySprites = (() => {
    const list = onStageSprites.map(([id, sp]) => ({
      id,
      position: sp.position,
      expression: sp.expression,
    }));
    if (speakerId && !stage.sprites[speakerId]) {
      list.push({ id: speakerId, position: "center", expression: speakerExpression });
    }
    return list;
  })();

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen cursor-pointer select-none flex-col justify-end overflow-hidden"
      style={{ backgroundColor: playerTheme.stage }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onAdvanceClick();
      }}
    >
      {/* 舞台层：背景 + 立绘，受镜头（缩放/平移/震屏）作用 */}
      <div className="absolute inset-0 z-0" style={cameraStyle}>
        <div
          key={`shake-${stage.shakeSeq}`}
          className={stage.shakeSeq > 0 ? "fx-shake absolute inset-0" : "absolute inset-0"}
          style={{ ["--shake" as string]: `${stage.shakeIntensity}px` }}
        >
          <div className="absolute inset-0" style={backgroundStyle} />
          {/* 在场立绘 */}
          {displaySprites.map(({ id, position, expression }) => {
            const src = resolveSprite(id, expression);
            const active = id === speakerId;
            if (!src) return null;
            return (
              <div
                key={id}
                className={`absolute bottom-[150px] transition-all duration-300 ${POSITION_CLASS[position] || POSITION_CLASS.center}`}
              >
                <img
                  src={src}
                  alt={charById[id]?.name || ""}
                  className={`max-h-[62vh] w-auto object-contain drop-shadow-2xl transition-all duration-300 ${active ? "opacity-100" : "opacity-55 saturate-[0.7]"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 全屏特效 + 转场层 */}
      <FxLayer stage={stage} />

      {/* HUD */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-30"
        onMouseEnter={() => setShowHud(true)}
        onMouseLeave={() => setShowHud(false)}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 transition-opacity duration-300 ${showHud ? "opacity-100" : "opacity-0"}`}
        >
          <PlayerHudBrand
            subtitle={
              currentScene?.title
                ? `${currentScene.title}${currentScene.atmosphere ? ` · ${currentScene.atmosphere}` : ""}`
                : pkg?.title
            }
          />
          <div className="flex items-center gap-4">
            <div onClick={(e) => e.stopPropagation()}>
              <UserAccountMenu variant="dark" />
            </div>
            {autoMode && (
              <span className="flex items-center gap-1 text-xs text-white/30 animate-pulse">
                <Pause className="h-3 w-3" strokeWidth={1.75} />
                自动
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAutoMode(!autoMode);
              }}
              className={`text-xs ${autoMode ? "text-white/50" : "text-white/15 hover:text-white/40"}`}
              aria-label={autoMode ? "关闭自动模式" : "开启自动模式"}
            >
              {autoMode ? (
                <Pause className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openOverlay("menu");
              }}
              className="text-white/15 hover:text-white/40"
              aria-label="菜单"
            >
              <Menu className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowStatePanel(!showStatePanel);
                setOverlay(null);
              }}
              className="text-xs text-white/15 hover:text-white/40"
            >
              状态 {stateCount > 0 && `(${stateCount})`}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openOverlay("backlog");
                setShowStatePanel(false);
              }}
              className="text-white/15 hover:text-white/40 text-xs"
            >
              回顾
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="text-white/15 hover:text-white/40 text-xs"
            >
              {isFullscreen ? "退出全屏" : "全屏"}
            </button>
          </div>
        </div>
      </div>

      {/* 锚点标记（结局桥段） */}
      {currentBeat?.isEnding && (
        <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2 text-center">
          <Anchor className="mx-auto h-5 w-5 animate-pulse text-amber-400/50" strokeWidth={1.75} />
          {currentBeat.endingLabel && (
            <p className="mt-2 text-xs tracking-widest text-amber-400/40">
              {currentBeat.endingLabel}
            </p>
          )}
        </div>
      )}

      {/* 旁白 */}
      {isNarration && (
        <div className="absolute inset-0 flex items-center justify-center z-10 px-12">
          <div className="max-w-lg text-center">
            <p className="text-white/60 text-lg leading-relaxed font-light">
              {line?.rich
                ? renderRich(displayedText, true, richOpts)
                : renderRich(displayedText, false, richOpts)}
              {isTyping && <span className="animate-pulse text-white/30">|</span>}
            </p>
          </div>
        </div>
      )}

      {/* 状态面板 */}
      {showStatePanel && (
        <div
          className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <h2 className="flex items-center gap-2 text-sm tracking-wider text-white/50">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              会话状态
            </h2>
            <button
              type="button"
              onClick={() => setShowStatePanel(false)}
              className="text-sm text-white/20 hover:text-white/50"
            >
              关闭
            </button>
          </div>
          <div className="flex-1 space-y-8 overflow-y-auto p-8">
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                记忆 ({memEntries.length})
              </h3>
              {memEntries.length === 0 ? (
                <p className="text-sm text-white/15">暂无记忆</p>
              ) : (
                <div className="space-y-2">
                  {memEntries.map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-white/40">{k}</span>
                      <p className="text-sm text-white/60">{formatVal(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                标志 ({flagEntries.length})
              </h3>
              {flagEntries.length === 0 ? (
                <p className="text-sm text-white/15">暂无标志</p>
              ) : (
                <div className="space-y-2">
                  {flagEntries.map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-white/40">{k}</span>
                      <p className="text-sm text-white/60">{formatVal(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                角色状态 ({charEntries.length})
              </h3>
              {charEntries.length === 0 ? (
                <p className="text-sm text-white/15">暂无角色状态</p>
              ) : (
                <div className="space-y-2">
                  {charEntries.map(([id, fields]) => (
                    <div key={id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <p className="text-sm text-white/70">{charById[id]?.name || id}</p>
                      <p className="text-xs text-white/35">{formatVal(fields)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* 回顾 */}
      {overlay === "backlog" && (
        <BacklogPanel
          entries={backlog}
          onClose={() => setOverlay(null)}
          onReplayVoice={replayVoice}
        />
      )}

      {/* 系统菜单 */}
      {overlay === "menu" && (
        <div
          className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid w-full max-w-sm grid-cols-2 gap-3 p-8">
            {(
              [
                ["load", "读档", Save],
                ["save", "存档", Save],
                ["settings", "设置", Settings],
                ["backlog", "回顾", ScrollText],
                ["gallery", "鉴赏", ImageIcon],
                ["codex", "档案", BookOpen],
                ["route", "回想", GitBranch],
                ["timeline", "时间线", Clock],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => openOverlay(key)}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white/80"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOverlay(null)}
              className="col-span-2 rounded-xl py-2 text-xs text-white/25 hover:text-white/50"
            >
              关闭 (Esc)
            </button>
          </div>
        </div>
      )}

      {overlay === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "save" && (
        <SaveSlotPanel
          slots={saveSlots}
          mode="save"
          onSelect={manualSave}
          onDelete={deleteSaveSlot}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "load" && (
        <SaveSlotPanel
          slots={saveSlots}
          mode="load"
          onSelect={manualLoad}
          onDelete={deleteSaveSlot}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "gallery" && pkg && (
        <GalleryPanel
          pkg={pkg}
          unlocks={unlocks}
          tab={galleryTab}
          onTabChange={setGalleryTab}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "codex" && (
        <CodexPanel
          glossary={pkg?.glossary ?? []}
          profiles={pkg?.characterProfiles ?? []}
          worldSetting={pkg?.worldSetting}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "route" && (
        <RouteReplayPanel
          history={routeHistory}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "timeline" && pkg && (
        <TimelinePanel
          pkg={pkg}
          completedBeatIds={new Set(rtState?.completedBeats ?? [])}
          currentBeatId={rtState?.currentBeatId ?? null}
          onClose={() => setOverlay(null)}
        />
      )}

      {activeTerm && (
        <TermTipPopover
          term={activeTerm.term}
          definition={activeTerm.definition}
          onClose={() => setActiveTerm(null)}
        />
      )}

      {/* 对话框 */}
      {isDialogue && (
        <div
          className="relative z-30 mx-auto w-full max-w-3xl mb-10 px-6"
          onClick={(e) => {
            e.stopPropagation();
            onAdvanceClick();
          }}
        >
          <div className="bg-black/70 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              {speakerExpression && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40 tracking-wide">
                  {expressionLabel(speakerExpression)}
                </span>
              )}
              <span className="text-white/50 font-medium text-sm tracking-wider">
                {line?.speaker}
              </span>
            </div>
            <p className="text-white/80 text-lg leading-relaxed min-h-[3em]">
              {line?.rich
                ? renderRich(displayedText, true, richOpts)
                : renderRich(displayedText, false, richOpts)}
              {isTyping && (
                <span className="inline-block w-0.5 h-5 bg-white/30 ml-0.5 animate-pulse" />
              )}
            </p>
            {textComplete && (
              <div className="mt-4 text-right">
                <span className="text-white/10 text-xs animate-pulse">空格继续</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分支选项 */}
      {showChoices && (
        <div
          className="relative z-30 mx-auto w-full max-w-lg mb-10 px-6 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {(view.choices ?? []).length === 0 ? (
              <p className="text-center text-sm text-white/40">分支无选项</p>
            ) : (
              view.choices!.map((choice) => (
                <button
                  key={choice.index}
                  onClick={() => doChoose(choice.index)}
                  disabled={choice.disabled}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-300 ${choice.disabled ? "bg-white/[0.02] border-white/5 text-white/10 cursor-not-allowed" : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/80"}`}
                >
                  <span className="text-white/15 text-xs font-mono mr-3">
                    {choice.index + 1}.
                  </span>
                  <span className="text-sm">{choice.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {achievementToast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-black/80 px-5 py-3 shadow-lg backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-sm font-medium text-white">成就解锁</p>
              <p className="text-xs text-white/70">{achievementToast.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
