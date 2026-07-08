import type { PlayerSettings } from "@/shared/lib/playerSettings";

interface SettingsPanelProps {
  settings: PlayerSettings;
  onChange: (next: PlayerSettings) => void;
  onClose: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-white/40">{label}</span>
        <span className="text-white/25">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white/60"
      />
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
  onClose,
}: SettingsPanelProps) {
  const patch = (p: Partial<PlayerSettings>) => onChange({ ...settings, ...p });

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-sm tracking-wider text-white/50">设置</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/20 hover:text-white/50"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        <SliderRow
          label="文字速度"
          value={settings.textSpeedMs}
          min={10}
          max={80}
          step={5}
          display={`${settings.textSpeedMs}ms/字`}
          onChange={(v) => patch({ textSpeedMs: v })}
        />
        <SliderRow
          label="自动播放间隔"
          value={settings.autoDelayMs}
          min={500}
          max={5000}
          step={250}
          display={`${(settings.autoDelayMs / 1000).toFixed(1)}s`}
          onChange={(v) => patch({ autoDelayMs: v })}
        />
        <SliderRow
          label="BGM 音量"
          value={settings.bgmVolume}
          min={0}
          max={1}
          step={0.05}
          display={`${Math.round(settings.bgmVolume * 100)}%`}
          onChange={(v) => patch({ bgmVolume: v })}
        />
        <SliderRow
          label="语音音量"
          value={settings.voiceVolume}
          min={0}
          max={1}
          step={0.05}
          display={`${Math.round(settings.voiceVolume * 100)}%`}
          onChange={(v) => patch({ voiceVolume: v })}
        />
        <SliderRow
          label="音效音量"
          value={settings.seVolume}
          min={0}
          max={1}
          step={0.05}
          display={`${Math.round(settings.seVolume * 100)}%`}
          onChange={(v) => patch({ seVolume: v })}
        />
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-white/50">跳过已读文本</span>
          <input
            type="checkbox"
            checked={settings.skipRead}
            onChange={(e) => patch({ skipRead: e.target.checked })}
            className="accent-white/70"
          />
        </label>
      </div>
    </div>
  );
}
