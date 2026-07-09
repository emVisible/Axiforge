/**
 * Axiforge 开发端口（517x 系列，避开 Vite 默认 5173）。
 * 修改此处后同步 vite 代理、CORS、README 与 dev.bash。
 */
export const PORTS = {
  api: 8000,
  web: 5174,
  admin: 5175,
  nexus: 5274,
};

export const origins = {
  api: `http://localhost:${PORTS.api}`,
  web: `http://localhost:${PORTS.web}`,
  admin: `http://localhost:${PORTS.admin}`,
  nexus: `http://localhost:${PORTS.nexus}`,
};

/** FastAPI CORS allow_origins */
export const corsOrigins = [
  origins.web,
  origins.admin,
  origins.nexus,
  origins.web.replace("localhost", "127.0.0.1"),
  origins.admin.replace("localhost", "127.0.0.1"),
  origins.nexus.replace("localhost", "127.0.0.1"),
];
