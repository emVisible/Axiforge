
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router";
import {
  Anchor,
  Circle,
  Pause,
  Play,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { playerApi } from "@/api/player";
import { expressionLabel } from "@/lib/expressions";
import { getImageUrl } from "@/lib/imageUrl";
import { routes } from "@/lib/routes";
import type {
  PlayerDrawResponse,
  PlayerNode,
  CharacterRuntimeStateResponse,
  SessionMemoryResponse,
  SessionFlagResponse,
} from "@/types/runtime";

function formatRuntimeValue(value: Record<string, unknown>): string {
  if (
    value &&
    typeof value === "object" &&
    "_value" in value &&
    Object.keys(value).length === 1
  ) {
    return String(value._value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// ============================================================
// VN Player
// ============================================================

export default function PlayerPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("loading");
  const [currentNode, setCurrentNode] = useState<PlayerNode | null>(null);
  const [characters, setCharacters] = useState<CharacterRuntimeStateResponse[]>(
    [],
  );
  const [history, setHistory] = useState<string[]>([]);
  const [memories, setMemories] = useState<SessionMemoryResponse[]>([]);
  const [flags, setFlags] = useState<SessionFlagResponse[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showStatePanel, setShowStatePanel] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [textComplete, setTextComplete] = useState(false);

  // ================================================================
  // 打字机
  // ================================================================
  const beginTypewriter = useCallback((node: PlayerNode) => {
    const fullText = node.dialogue || node.narration || "";
    if (!fullText) {
      setDisplayedText("");
      setIsTyping(false);
      setTextComplete(true);
      return;
    }
    setIsTyping(true);
    setTextComplete(false);
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
        setTextComplete(true);
      }
    }, 35);
    return () => clearInterval(timer);
  }, []);

  // ================================================================
  // applyDraw
  // ================================================================
  const applyDraw = useCallback(
    (draw: PlayerDrawResponse) => {
      setSessionStatus(draw.session_status);
      if (draw.available_nodes.length > 0) {
        const node = draw.available_nodes[0];
        setCurrentNode(node);
        beginTypewriter(node);
      } else {
        setCurrentNode(null);
        setDisplayedText("");
        setIsTyping(false);
        setTextComplete(true);
      }
    },
    [beginTypewriter],
  );

  // ================================================================
  // 会话状态
  // ================================================================
  const refreshSessionState = useCallback(async (sid: string) => {
    const [mems, flgs, states] = await Promise.all([
      playerApi.getMemories(sid),
      playerApi.getFlags(sid),
      playerApi.getCharacterStates(sid),
    ]);
    setMemories(mems);
    setFlags(flgs);
    setCharacters(states);
  }, []);

  // ================================================================
  // 开始会话
  // ================================================================
  const startSession = useCallback(async () => {
    if (!projectId || sessionId) return;
    try {
      setSessionStatus("loading");
      const session = await playerApi.startSession({
        project_id: projectId,
        player_name: "玩家",
      });
      setSessionId(session.id);
      await refreshSessionState(session.id);
      const draw = await playerApi.draw(session.id);
      applyDraw(draw);
    } catch {
      setSessionStatus("error");
    }
  }, [projectId, sessionId, applyDraw, refreshSessionState]);

  useEffect(() => {
    startSession();
  }, []); // eslint-disable-line

  // ================================================================
  // 推进
  // ================================================================
  const advanceNode = useCallback(
    async (choiceLabel?: string) => {
      if (!sessionId || !currentNode) return;
      const historyLine = currentNode.speaker_name
        ? `${currentNode.speaker_name}: ${currentNode.dialogue || ""}`
        : currentNode.narration || "";
      if (historyLine) setHistory((prev) => [...prev, historyLine]);
      try {
        const draw = await playerApi.complete(sessionId, {
          node_id: currentNode.node_id,
          choice_label: choiceLabel || null,
        });
        await refreshSessionState(sessionId);
        applyDraw(draw);
      } catch {
        /* ignore */
      }
    },
    [sessionId, currentNode, applyDraw, refreshSessionState],
  );

  // 自动模式
  useEffect(() => {
    if (autoMode && textComplete && currentNode && !isTyping) {
      if (currentNode.choices && currentNode.choices.length > 0) return;
      autoTimerRef.current = setTimeout(() => advanceNode(), 2000);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [autoMode, textComplete, currentNode, isTyping, advanceNode]);

  // ================================================================
  // 全屏
  // ================================================================
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ================================================================
  // 点击 / 键盘
  // ================================================================
  const skipTyping = useCallback(() => {
    if (isTyping && currentNode) {
      const fullText = currentNode.dialogue || currentNode.narration || "";
      setDisplayedText(fullText);
      setIsTyping(false);
      setTextComplete(true);
    } else if (textComplete && currentNode) {
      if (currentNode.choices && currentNode.choices.length > 0) return;
      advanceNode();
    }
  }, [isTyping, textComplete, currentNode, advanceNode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showBacklog || showStatePanel) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skipTyping();
      }
      if (
        e.key >= "1" &&
        e.key <= "9" &&
        textComplete &&
        currentNode?.choices
      ) {
        const idx = parseInt(e.key) - 1;
        if (
          idx < currentNode.choices.length &&
          !currentNode.choices[idx].disabled
        ) {
          advanceNode(currentNode.choices[idx].label);
        }
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
  }, [
    showBacklog,
    showStatePanel,
    skipTyping,
    textComplete,
    currentNode,
    advanceNode,
    toggleFullscreen,
  ]);

  // ================================================================
  // 渲染
  // ================================================================
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus === "error") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60">加载失败</p>
          <button
            onClick={() => {
              setSessionStatus("loading");
              setSessionId(null);
              startSession();
            }}
            className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (sessionStatus === "completed" && !currentNode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <Circle className="mx-auto h-16 w-16 text-white/20" strokeWidth={1} />
          <h1 className="text-2xl font-light tracking-[0.3em] text-white/80">
            终
          </h1>
          <p className="text-white/30 text-sm">故事已结束</p>
          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={() => {
                setSessionId(null);
                setSessionStatus("loading");
                setHistory([]);
                startSession();
              }}
              className="px-8 py-3 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 text-sm tracking-wider"
            >
              重新开始
            </button>
            <Link
              to={routes.project(projectId!)}
              className="rounded-xl border border-white/10 px-8 py-3 text-sm text-white/40 hover:border-white/30 hover:text-white/60"
            >
              返回编辑
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === "active" && !currentNode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/30">
            <ScrollText className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-white/60 text-xl font-light">暂无内容</h1>
          <p className="text-white/20 text-sm">该剧本还没有场景和节点</p>
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

  const speakerName = currentNode?.speaker_name || "";
  const speakerOnStage = speakerName
    ? currentNode?.characters_on_stage?.find((c) => c.name === speakerName)
    : null;
  const speakerState = speakerName
    ? characters.find((c) => c.character_name === speakerName)
    : null;
  const speakerImageUrl = getImageUrl(
    speakerOnStage?.image_path || speakerState?.image_path || undefined,
  );
  const hasChoices = !!(currentNode?.choices && currentNode.choices.length > 1);

  const backgroundStyle = currentNode?.background_image
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(10,10,20,0.55) 0%, rgba(10,10,20,0.75) 45%, rgba(20,20,40,0.92) 100%), url(${currentNode.background_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a0a14",
      }
    : {
        backgroundImage:
          "linear-gradient(180deg, #0a0a14 0%, #0f0f1e 40%, #141428 100%)",
        backgroundColor: "#0a0a14",
      };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen cursor-pointer select-none flex-col justify-end bg-cover bg-center"
      style={backgroundStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) skipTyping();
      }}
    >
      {/* HUD */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-30"
        onMouseEnter={() => setShowHud(true)}
        onMouseLeave={() => setShowHud(false)}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 transition-opacity duration-300 ${showHud ? "opacity-100" : "opacity-0"}`}
        >
          <span className="text-xs tracking-widest text-white/15">
            {currentNode?.scene_title || ""}
            {currentNode?.atmosphere && (
              <span className="ml-2 text-white/10">
                · {currentNode.atmosphere}
              </span>
            )}
          </span>
          <div className="flex items-center gap-4">
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
                setShowStatePanel(!showStatePanel);
                setShowBacklog(false);
              }}
              className="text-xs text-white/15 hover:text-white/40"
            >
              状态 {memories.length + flags.length > 0 && `(${memories.length + flags.length})`}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBacklog(!showBacklog);
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("退出？")) {
                  setSessionId(null);
                  setSessionStatus("idle");
                }
              }}
              className="text-white/15 hover:text-red-400 text-xs"
            >
              退出
            </button>
          </div>
        </div>
      </div>

      {/* 锚点 */}
      {currentNode?.is_anchor && (
        <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2">
          <Anchor
            className="h-5 w-5 animate-pulse text-amber-400/50"
            strokeWidth={1.75}
          />
        </div>
      )}

      {/* 立绘 */}
      {speakerName && (
        <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-20">
          <div className="flex flex-col items-center">
            {speakerImageUrl ? (
              <div className="mb-2 h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/30">
                <img
                  src={speakerImageUrl}
                  alt={speakerName}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-white/5 px-2 backdrop-blur-sm">
                <span className="text-center text-[10px] leading-tight text-white/40">
                  {expressionLabel(speakerState?.current_expression)}
                </span>
              </div>
            )}
            <span className="text-xs tracking-wider text-white/30">
              {speakerName}
            </span>
          </div>
        </div>
      )}

      {/* 旁白 */}
      {currentNode && !currentNode.speaker_name && currentNode.narration && (
        <div className="absolute inset-0 flex items-center justify-center z-10 px-12">
          <div className="max-w-lg text-center">
            <p className="text-white/60 text-lg leading-relaxed font-light">
              {displayedText}
              {isTyping && (
                <span className="animate-pulse text-white/30">|</span>
              )}
            </p>
          </div>
        </div>
      )}

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
                记忆 ({memories.length})
              </h3>
              {memories.length === 0 ? (
                <p className="text-sm text-white/15">暂无记忆</p>
              ) : (
                <div className="space-y-2">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <span className="text-xs text-white/40">{m.key}</span>
                      <p className="text-sm text-white/60">
                        {formatRuntimeValue(m.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                标志 ({flags.length})
              </h3>
              {flags.length === 0 ? (
                <p className="text-sm text-white/15">暂无标志</p>
              ) : (
                <div className="space-y-2">
                  {flags.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <span className="text-xs text-white/40">{f.key}</span>
                      <p className="text-sm text-white/60">
                        {formatRuntimeValue(f.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                角色状态 ({characters.length})
              </h3>
              {characters.length === 0 ? (
                <p className="text-sm text-white/15">暂无角色状态</p>
              ) : (
                <div className="space-y-2">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <p className="text-sm text-white/70">{c.character_name}</p>
                      <p className="text-xs text-white/35">
                        心情 {c.mood} · 好感 {c.affection}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* 回顾 */}
      {showBacklog && (
        <div
          className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-white/50 text-sm tracking-wider">对话回顾</h2>
            <button
              onClick={() => setShowBacklog(false)}
              className="text-white/20 hover:text-white/50 text-sm"
            >
              关闭
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {history.map((line, i) => (
              <p key={i} className="text-white/30 text-sm leading-relaxed">
                {line}
              </p>
            ))}
            {history.length === 0 && (
              <p className="text-white/10 text-sm text-center py-20">
                暂无对话记录
              </p>
            )}
          </div>
        </div>
      )}

      {/* 对话框 */}
      {currentNode && currentNode.speaker_name && (
        <div
          className="relative z-30 mx-auto w-full max-w-3xl mb-10 px-6"
          onClick={(e) => {
            e.stopPropagation();
            skipTyping();
          }}
        >
          <div className="bg-black/70 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40 tracking-wide">
                {expressionLabel(speakerState?.current_expression)}
              </span>
              <span className="text-white/50 font-medium text-sm tracking-wider">
                {speakerName}
              </span>
              {speakerState?.mood && (
                <span className="text-white/15 text-xs">
                  · {speakerState.mood}
                </span>
              )}
            </div>
            <p className="text-white/80 text-lg leading-relaxed min-h-[3em]">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-0.5 h-5 bg-white/30 ml-0.5 animate-pulse" />
              )}
            </p>
            {textComplete && !hasChoices && (
              <div className="mt-4 text-right">
                <span className="text-white/10 text-xs animate-pulse">
                  空格继续
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分支选项 — 仅在多出边时显示 */}
      {currentNode && textComplete && hasChoices && (
        <div
          className="relative z-30 mx-auto w-full max-w-lg mb-10 px-6 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {currentNode.choices!.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!choice.disabled) advanceNode(choice.label);
                }}
                disabled={choice.disabled}
                className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-300 ${choice.disabled ? "bg-white/[0.02] border-white/5 text-white/10 cursor-not-allowed" : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/80"}`}
              >
                <span className="text-white/15 text-xs font-mono mr-3">
                  {idx + 1}.
                </span>
                <span className="text-sm">{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
