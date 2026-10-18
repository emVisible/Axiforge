/**
 * ImageUpload 的宿主绑定版——把「字节落哪」与「引用怎么显示」两个平台能力
 * 注入 packages/ui 的无平台组件；调用方仍可显式覆盖这两个口。
 */
import type { ComponentProps } from "react";
import { ImageUpload as BaseImageUpload } from "@axiforge/ui";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { uploadFileAsAsset } from "@/shared/storage/assetUpload";

export default function ImageUpload(
  props: ComponentProps<typeof BaseImageUpload>,
) {
  return (
    <BaseImageUpload
      upload={uploadFileAsAsset}
      resolve={(ref) => getImageUrl(ref) ?? ""}
      {...props}
    />
  );
}
