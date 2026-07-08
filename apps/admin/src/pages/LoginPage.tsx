import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input } from "@axiforge/ui";
import { setAdminToken, verifyAdminToken } from "@/api/adminClient";

const DEV_TOKEN = "dev-admin";

export default function LoginPage() {
  const [token, setToken] = useState(DEV_TOKEN);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("请输入 ADMIN_TOKEN");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const ok = await verifyAdminToken(trimmed);
      if (!ok) {
        setError("Token 无效，请检查后端 ADMIN_TOKEN 配置");
        return;
      }
      setAdminToken(trimmed);
      navigate("/", { replace: true });
    } catch {
      setError("无法连接后端服务，请稍后重试");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-sm" padding="lg">
        <form onSubmit={submit}>
          <h1 className="text-lg font-semibold text-ink">Axiforge 管理中台</h1>
          <p className="mt-1 text-sm text-ink-muted">
            输入后端 <code className="text-xs">ADMIN_TOKEN</code>（开发环境默认{" "}
            <code className="text-xs">{DEV_TOKEN}</code>）
          </p>
          <div className="mt-4">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer token"
              error={error || undefined}
              autoFocus
            />
          </div>
          <Button type="submit" className="mt-4 w-full" loading={checking}>
            进入
          </Button>
        </form>
      </Card>
    </div>
  );
}
