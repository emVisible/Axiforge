/**
 * 复制到剪贴板的**唯一通路**（桌面是唯一发布目标，这一截必须有可判的失败态）。
 *
 * 为什么要收成一处：`navigator.clipboard.writeText` 在没有剪贴板权限、非安全上下文、
 * 或壳不提供该能力时会 reject。此前 6 个调用点是三种形状——`window.prompt` 兜底一处、
 * `document.execCommand("copy")` 兜底两处（两份都把返回值丢了，`false` 也被当成复制成）、
 * 以及**三处完全没有兜底**（按钮既不报成功也不报失败，用户以为内容已在剪贴板里）。
 * 同一件事三套实现＝三套语义，正是本项目点过名的「抄两遍」那一族。
 *
 * 返回值是**结论**而不是布尔：`"copied"` 意味着内容确实进了剪贴板，`"manual"` 意味着没有
 * ——调用方据此给可见反馈，不许静默。
 *
 * `clipboardDeps` 是平台分派口（同 `shared/storage/playerSavesDeps.ts` 的理由与形状）：
 * 本仓的单测宿主是 node，没有 `document`/`navigator`，没有这个口子就只能整条判据都不写，
 * 或者把测试脚手架塞进生产 API。桩它，正路与两条退回支都变成可执行路径。
 */
export type CopyOutcome = "copied" | "manual";

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    // execCommand 返回布尔：false 是"没复制成"，不是异常。忽略它就等于把失败报成成功。
    return Boolean(document.execCommand("copy"));
  } finally {
    ta.remove();
  }
}

export const clipboardDeps = {
  write: (text: string) => navigator.clipboard.writeText(text),
  legacyCopy,
};

export async function copyText(text: string): Promise<CopyOutcome> {
  try {
    await clipboardDeps.write(text);
    return "copied";
  } catch {
    try {
      return clipboardDeps.legacyCopy(text) ? "copied" : "manual";
    } catch {
      return "manual";
    }
  }
}
