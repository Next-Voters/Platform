interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export function SFSkyline({ className, style }: Props) {
  return (
    <svg
      viewBox="0 0 1200 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYEnd meet"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M 0 250 Q 90 225 180 235 Q 270 245 380 220 Q 490 195 620 215 Q 750 235 880 215 Q 1010 195 1110 215 Q 1170 225 1200 230"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <line x1="0" y1="265" x2="1200" y2="265" strokeWidth="1" opacity="0.4" />
      <line x1="40" y1="190" x2="1160" y2="190" />
      <line x1="282" y1="60" x2="282" y2="250" />
      <line x1="322" y1="60" x2="322" y2="250" />
      <line x1="282" y1="60" x2="322" y2="60" />
      <line x1="282" y1="100" x2="322" y2="100" />
      <line x1="282" y1="140" x2="322" y2="140" />
      <line x1="878" y1="60" x2="878" y2="250" />
      <line x1="918" y1="60" x2="918" y2="250" />
      <line x1="878" y1="60" x2="918" y2="60" />
      <line x1="878" y1="100" x2="918" y2="100" />
      <line x1="878" y1="140" x2="918" y2="140" />
      <path d="M 40 190 Q 160 60, 302 60 Q 600 200, 898 60 Q 1040 60, 1160 190" />
      <line x1="120" y1="120" x2="120" y2="190" opacity="0.5" />
      <line x1="200" y1="80" x2="200" y2="190" opacity="0.5" />
      <line x1="400" y1="100" x2="400" y2="190" opacity="0.5" />
      <line x1="500" y1="140" x2="500" y2="190" opacity="0.5" />
      <line x1="600" y1="170" x2="600" y2="190" opacity="0.5" />
      <line x1="700" y1="140" x2="700" y2="190" opacity="0.5" />
      <line x1="800" y1="100" x2="800" y2="190" opacity="0.5" />
      <line x1="1000" y1="80" x2="1000" y2="190" opacity="0.5" />
      <line x1="1080" y1="120" x2="1080" y2="190" opacity="0.5" />
    </svg>
  );
}
