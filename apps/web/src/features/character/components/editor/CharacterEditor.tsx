import { useMemo, useState, type ComponentType } from "react";
import {
  Anchor,
  Brain,
  ChevronDown,
  Drama,
  Link2,
  ScrollText,
  UserRound,
} from "lucide-react";
import { useEditorStore } from "@/shared/stores/editorStore";
import ContourEditor from "./ContourEditor";
import DemeanorEditor from "./DemeanorEditor";
import PsycheEditor from "./PsycheEditor";
import AnchorEditor from "./AnchorEditor";
import TraceEditor from "./TraceEditor";
import BondEditor from "./BondEditor";
import SpriteEditor from "./SpriteEditor";
import { Images } from "lucide-react";

interface LayerConfig {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  description: string;
  distance: string;
  color: string;
  component: React.ComponentType;
}

interface CharacterEditorProps {
  imagePath?: string;
  onImageChange?: (path: string) => void;
  isPublic?: boolean;
  onPublicChange?: (v: boolean) => void;
}

export default function CharacterEditor({
  imagePath,
  onImageChange,
  isPublic,
  onPublicChange,
}: CharacterEditorProps) {
  const { draft } = useEditorStore();
  const [expandedLayer, setExpandedLayer] = useState<string | null>("anchor");
  if (!draft) return null;

  const layers: LayerConfig[] = useMemo(
    () => [
      {
        key: "anchor",
        label: "锚点",
        Icon: Anchor,
        description: "内核·定义性",
        distance: "核心",
        color: "border-purple-300 bg-purple-50",
        component: (props: any) => (
          <AnchorEditor
            {...props}
            imagePath={imagePath}
            onImageChange={onImageChange}
            isPublic={isPublic}
            onPublicChange={onPublicChange}
          />
        ),
      },
      {
        key: "contour",
        label: "轮廓",
        Icon: UserRound,
        description: "表象·可见",
        distance: "外层",
        color: "border-blue-400/40 bg-blue-500/10",
        component: ContourEditor,
      },
      {
        key: "demeanor",
        label: "举止",
        Icon: Drama,
        description: "行为·可观察",
        distance: "外层",
        color: "border-cyan-400/40 bg-cyan-500/10",
        component: DemeanorEditor,
      },
      {
        key: "psyche",
        label: "内心",
        Icon: Brain,
        description: "心理·需深入",
        distance: "中层",
        color: "border-rose-400/40 bg-rose-500/10",
        component: PsycheEditor,
      },
      {
        key: "trace",
        label: "轨迹",
        Icon: ScrollText,
        description: "历史·塑造",
        distance: "中层",
        color: "border-amber-400/40 bg-amber-500/10",
        component: TraceEditor,
      },
      {
        key: "bond",
        label: "羁绊",
        Icon: Link2,
        description: "关系·连接",
        distance: "外层",
        color: "border-emerald-400/40 bg-emerald-500/10",
        component: BondEditor,
      },
    ],
    [imagePath, onImageChange, isPublic, onPublicChange],
  );

  const getFillProgress = (layer: LayerConfig): number => {
    const data = (draft as any)[layer.key];
    if (!data) return 0;
    if (layer.key === "trace") {
      const fields = ["background", "turning_point"];
      const filled = fields.filter((k) => data[k] && data[k] !== "").length;
      const hasEvents = data.key_events?.length > 0;
      return Math.round(
        ((filled + (hasEvents ? 1 : 0)) / (fields.length + 1)) * 100,
      );
    }
    if (layer.key === "anchor") {
      const fields = ["name", "essence", "summary", "theme", "core_belief"];
      const filled = fields.filter((k) => data[k] && data[k] !== "").length;
      const hasTags = data.tags?.length > 0;
      return Math.round(
        ((filled + (hasTags ? 1 : 0)) / (fields.length + 1)) * 100,
      );
    }
    const entries = Object.entries(data).filter(([k]) => k !== "key_events");
    const filled = entries.filter(([_, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== "" && v !== null && v !== undefined;
    }).length;
    return entries.length > 0 ? Math.round((filled / entries.length) * 100) : 0;
  };

  return (
    <div className="space-y-3">
      {layers.map((layer) => {
        const isExpanded = expandedLayer === layer.key;
        const progress = getFillProgress(layer);
        const LayerComponent = layer.component;

        const LayerIcon = layer.Icon;

        return (
          <div
            key={layer.key}
            className={`border-2 rounded-xl transition-all duration-200 ${
              isExpanded
                ? layer.color + " overflow-visible"
                : "border-border hover:border-border overflow-hidden"
            }`}
          >
            <button
              onClick={() => setExpandedLayer(isExpanded ? null : layer.key)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface/70">
                <LayerIcon className="h-4 w-4 text-brand" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">
                    {layer.label}
                  </span>
                  <span className="text-3xs text-ink-muted bg-canvas px-2 py-0.5 rounded-full font-medium">
                    {layer.distance}
                  </span>
                </div>
                <p className="text-sm text-ink-muted">{layer.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress > 0 ? "bg-brand" : "bg-transparent"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-muted w-8 text-right">
                    {progress}%
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-ink-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                />
              </div>
            </button>
            {isExpanded && (
              <div className="px-5 pb-5">
                <div className="border-t border-border pt-5">
                  <LayerComponent />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 立绘 / 表情差分（演出资产，非六层语义） */}
      {(() => {
        const isExpanded = expandedLayer === "sprites";
        const count = Object.keys((draft as any).sprites || {}).length;
        return (
          <div
            className={`border-2 rounded-xl transition-all duration-200 ${
              isExpanded
                ? "border-sky-400/40 bg-sky-500/10 overflow-visible"
                : "border-border hover:border-border overflow-hidden"
            }`}
          >
            <button
              onClick={() => setExpandedLayer(isExpanded ? null : "sprites")}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface/70">
                <Images className="h-4 w-4 text-brand" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">立绘 / 表情差分</span>
                  <span className="text-3xs text-ink-muted bg-canvas px-2 py-0.5 rounded-full font-medium">
                    演出资产
                  </span>
                </div>
                <p className="text-sm text-ink-muted">
                  {count > 0 ? `${count} 档差分` : "上传不同表情的立绘"}
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-ink-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                strokeWidth={1.75}
              />
            </button>
            {isExpanded && (
              <div className="px-5 pb-5">
                <div className="border-t border-border pt-5">
                  <SpriteEditor />
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
