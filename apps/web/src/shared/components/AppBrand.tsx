import { Link } from "react-router";

import AppIcon from "@/shared/components/AppIcon";
import { APP_NAME } from "@/shared/lib/constants";
import { routes } from "@/shared/lib/routes";

interface AppBrandProps {
  variant?: "light" | "dark";
  zone?: string;
  href?: string;
}

export default function AppBrand({
  variant = "light",
  zone,
  href = routes.discover,
}: AppBrandProps) {
  const isDark = variant === "dark";

  return (
    <Link to={href} className="flex items-center gap-2.5">
      <AppIcon size="md" variant={variant} />
      <div className="flex items-baseline gap-2">
        <span
          className={`text-sm font-semibold tracking-tight ${
            isDark ? "text-white" : "text-ink"
          }`}
        >
          {APP_NAME}
        </span>
        {zone && (
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              isDark ? "text-white/30" : "text-ink-muted"
            }`}
          >
            {zone}
          </span>
        )}
      </div>
    </Link>
  );
}
