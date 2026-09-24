import { assetDisplayUrl } from "@/shared/storage/assetContext";

/**
 * 图片引用 → 可显示 URL（全仓唯一出口）。
 * 服务端引用（`/uploads/...`）原样透传；桌面本地素材（`assets/...`）经根目录
 * 与 asset 协议解析；无法显示时返回 null，由调用方渲染缺图态。
 */
export function getImageUrl(imagePath?: string | null): string | null {
  const url = assetDisplayUrl(imagePath);
  return url === "" ? null : url;
}
