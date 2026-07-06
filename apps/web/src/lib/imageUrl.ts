export function getImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  // image_path 格式是 /uploads/characters/xxx.png
  return imagePath;
}