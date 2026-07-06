import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  to: string;
  children: React.ReactNode;
}

export default function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
      {children}
    </Link>
  );
}
