/**
 * Provider 工厂——按运行环境选择存储实现（ADR-024：云能力缺席时创作流可用）。
 *
 * - 桌面（Tauri webview）：SQLite（本地 DB 文件，断网全功能）
 * - 浏览器：HTTP（既有 FastAPI 后端）
 * 云同步/协作服务后期以装饰器形态叠加，不改变本工厂签名。
 */
import {
  SqliteStorageProvider,
  type StorageProvider,
} from "@axiforge/editor-core";
import { HttpStorageProvider } from "./httpStorageProvider";
import { isTauriEnvironment, TauriSqlBackend } from "./tauriSqlBackend";
import { getCreatorId } from "@/shared/lib/creatorId";

export async function createStorageProvider(): Promise<StorageProvider> {
  if (isTauriEnvironment()) {
    const provider = new SqliteStorageProvider(new TauriSqlBackend());
    await provider.init();
    return provider;
  }
  return new HttpStorageProvider(getCreatorId());
}
