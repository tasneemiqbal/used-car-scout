// Scout's chatbot face, drawn in brand colours so it stays crisp at any size.
export function ScoutAvatar({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="Scout" className={`shrink-0 ${className}`}>
      <circle cx="20" cy="20" r="20" fill="var(--brand-accent)" />
      <circle cx="20" cy="20" r="14" fill="var(--brand-accent-tint)" />
      <circle cx="15.5" cy="17.5" r="2" fill="var(--brand-primary)" />
      <circle cx="24.5" cy="17.5" r="2" fill="var(--brand-primary)" />
      <path
        d="M13.5 23 Q20 29 26.5 23"
        fill="none"
        stroke="var(--brand-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
