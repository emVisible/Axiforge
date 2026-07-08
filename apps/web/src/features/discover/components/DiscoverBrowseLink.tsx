import { Link } from "react-router";
import { Compass } from "lucide-react";

import { routes } from "@/shared/lib/routes";

interface DiscoverBrowseLinkProps {
  tab?: "projects" | "characters" | "items" | "scenes";
  label?: string;
}

export default function DiscoverBrowseLink({
  tab,
  label = "去 Discover 浏览更多",
}: DiscoverBrowseLinkProps) {
  const href = tab ? `${routes.discover}?tab=${tab}` : routes.discover;
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand/30 hover:text-brand"
    >
      <Compass className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
