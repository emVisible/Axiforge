import { cn } from "@/shared/components/ui";

type AppIconSize = "sm" | "md" | "lg";

const sizeClasses: Record<AppIconSize, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-8 w-8 rounded-lg",
  lg: "h-10 w-10 rounded-xl",
};

interface AppIconProps {
  size?: AppIconSize;
  className?: string;
}

/** 无文字品牌标：叙事轴心（六边形层 + 轴心高光） */
export default function AppIcon({ size = "md", className = "" }: AppIconProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="axi-bg" x1="4" y1="4" x2="28" y2="28">
            <stop stopColor="#3b3473" />
            <stop offset="1" stopColor="#4a4380" />
          </linearGradient>
          <linearGradient id="axi-line" x1="16" y1="8" x2="16" y2="24">
            <stop stopColor="#c4944a" stopOpacity="0.3" />
            <stop offset="0.5" stopColor="#c4944a" />
            <stop offset="1" stopColor="#c4944a" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#axi-bg)" />
        <path
          d="M16 7.5 23.5 12v8L16 24.5 8.5 20v-8L16 7.5Z"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <path
          d="M16 10.5 20.5 13.25v5.5L16 21.5 11.5 18.75v-5.5L16 10.5Z"
          stroke="white"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <path
          d="M16 13.5 17.75 14.5v3L16 18.5 14.25 17.5v-3L16 13.5Z"
          stroke="#c4944a"
          strokeOpacity="0.85"
          strokeWidth="1"
        />
        <line
          x1="16"
          y1="8"
          x2="16"
          y2="24"
          stroke="url(#axi-line)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2" fill="#c4944a" />
        <circle cx="16" cy="16" r="1" fill="white" fillOpacity="0.9" />
      </svg>
    </span>
  );
}
