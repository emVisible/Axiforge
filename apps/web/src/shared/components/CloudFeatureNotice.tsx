/**
 * 云端专属能力在桌面离线态的缺席说明。
 *
 * 原则（宪章 Q4/Q5）：缺席要**说出来**，不能伪装成空数据、也不能沉默地报网络错。
 * 文案只讲两件事：这是什么、这里为什么没有——不承诺尚未实现的功能。
 */
export default function CloudFeatureNotice({
  feature,
  className = "",
}: {
  feature: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`rounded-xl border border-border bg-panel px-4 py-3 ${className}`}
    >
      <p className="text-sm font-medium text-ink">{feature}需要协作服务</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        桌面版默认离线创作；账号、在线内容与发布不在此版本内。
      </p>
    </div>
  );
}
