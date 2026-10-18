import { useState } from "react";

import { useUser } from "@/app/providers/UserContext";
import Toast from "@/shared/components/Toast";
import CloudFeatureNotice from "@/shared/components/CloudFeatureNotice";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import {
  Button,
  Card,
  Input,
  PageHeader,
} from "@/shared/components/ui";

const AVATAR_OPTIONS = ["🎭", "🌸", "⚔️", "🌙", "✨", "🔮", "🎪", "🦊", "🐉", "🌊", "🔥", "🍀"];

export default function ProfilePage() {
  const {
    profile,
    displayLabel,
    bindEmail,
    restoreFromEmail,
    setDisplayName,
    setAvatarEmoji,
    exportData,
    deleteAccount,
  } = useUser();
  const [displayName, setDisplayNameLocal] = useState(profile?.display_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      showToast(ok);
    } catch {
      showToast("操作失败", "error");
    } finally {
      setBusy(false);
    }
  };

  /*
   * 这一页每一件事都要协作服务：头像、昵称、邮箱绑定、邮箱恢复、导出数据、注销账户——
   * 六个动作全直连 userApi，没有本地替身。桌面离线态留着它们，等于给用户六个
   * 点了只会弹「操作失败」的按钮；按既定约定（CloudFeatureNotice 那句"缺席要说出来"）
   * 换成显式缺席，同时把仍然真实存在的本地身份留在页面上。
   */
  if (isLocalOnlyDeployment()) {
    return (
      <>
        <PageHeader
          title="账户设置"
          description="这一页在本机只保留你的身份；昵称、头像、邮箱与数据管理都在协作服务那一侧"
        />
        <div className="mx-auto max-w-lg">
          <Card>
            <p className="text-xs text-ink-muted">当前身份：{displayLabel}</p>
            <CloudFeatureNotice feature="账户设置" className="mt-3" />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="账户设置"
        description="管理昵称、头像、邮箱与数据"
      />

      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-ink">个人资料</h2>
          <p className="mt-1 text-xs text-ink-muted">当前身份：{displayLabel}</p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink-muted">头像</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => run(() => setAvatarEmoji(emoji), "头像已更新")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-colors ${
                    profile?.avatar_emoji === emoji
                      ? "border-brand bg-brand-muted"
                      : "border-border bg-surface hover:border-ink-muted/30"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              label="显示昵称"
              value={displayName}
              onChange={(e) => setDisplayNameLocal(e.target.value)}
              placeholder="在作者页和菜单中显示"
            />
            <Button
              size="sm"
              loading={busy}
              disabled={!displayName.trim()}
              onClick={() =>
                run(() => setDisplayName(displayName.trim()), "昵称已保存")
              }
            >
              保存昵称
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">邮箱绑定</h2>
          <p className="mt-1 text-xs text-ink-muted">
            「绑定」为当前设备关联邮箱；「恢复」用邮箱找回旧账号（会覆盖当前设备身份）。
          </p>
          <div className="mt-4 space-y-3">
            <Input
              type="email"
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                loading={busy}
                onClick={() => run(() => bindEmail(email), "邮箱已绑定到当前账号")}
              >
                绑定到当前账号
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={busy}
                onClick={() =>
                  run(() => restoreFromEmail(email), "身份已恢复，正在刷新…")
                }
              >
                用邮箱恢复旧账号
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">数据与账号</h2>
          <p className="mt-1 text-xs text-ink-muted">
            注销后用户档案会被删除，但已发布的作品和角色会保留为匿名数据。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => run(async () => exportData(), "数据已导出")}
            >
              导出我的数据
            </Button>
            {!confirmDelete ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
              >
                注销账号
              </Button>
            ) : (
              <Button
                size="sm"
                variant="danger"
                loading={busy}
                onClick={() => run(async () => deleteAccount(), "")}
              >
                确认注销
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
