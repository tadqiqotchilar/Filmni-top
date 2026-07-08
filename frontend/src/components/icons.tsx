interface IconProps {
  className?: string;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.05 2.05 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.17a2.05 2.05 0 1 1-4.1 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.05 2.05 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H2.6a2.05 2.05 0 1 1 0-4.1h.09A1.7 1.7 0 0 0 4.25 7.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.05 2.05 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V1.24a2.05 2.05 0 1 1 4.1 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.05 2.05 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03h.17a2.05 2.05 0 1 1 0 4.1h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3h1M17 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3h-1" />
      <path d="M12 13v3M9 20h6M9.5 20c0-2 .8-3 2.5-4 1.7 1 2.5 2 2.5 4" />
    </svg>
  );
}
