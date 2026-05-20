// SVG silhouette icons for Ukrainian freshwater fish.
// viewBox 0 0 100 50 — head faces right, tail faces left.
// size prop = height in px; width = size * 2.

import React from "react";

type Props = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

function normalize(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("щука")) return "щука";
  if (n.includes("лящ")) return "лящ";
  if (n.includes("сом")) return "сом";
  if (n.includes("окунь")) return "окунь";
  if (n.includes("форель")) return "форель";
  if (n.includes("товстолоб")) return "товстолоб";
  if (n.includes("судак")) return "судак";
  if (n.includes("амур")) return "амур";
  if (n.includes("карась")) return "карась";
  if (n.includes("короп") || n.includes("сазан")) return "короп";
  return "generic";
}

const SHAPES: Record<string, React.ReactNode> = {
  // Carp — deep oval body, pronounced dorsal curve
  "короп": (
    <path d="M 4,11 L 18,18 C 28,7 50,3 68,8 C 78,11 87,18 88,25 C 87,32 79,39 68,42 C 50,47 28,43 18,32 L 4,39 L 14,25 Z" />
  ),

  // Pike — very elongated, needle-like profile
  "щука": (
    <path d="M 4,17 L 18,21 C 30,15 55,11 78,13 C 88,15 95,20 97,25 C 95,30 88,33 78,31 C 55,29 30,27 18,27 L 4,31 L 12,25 Z" />
  ),

  // Crucian carp — round, compact, shallower than carp
  "карась": (
    <path d="M 4,12 L 18,18 C 28,9 48,5 66,10 C 76,14 84,19 84,25 C 84,31 76,36 66,40 C 48,45 28,41 18,32 L 4,38 L 14,25 Z" />
  ),

  // Bream — disc-shaped, very tall relative to length
  "лящ": (
    <path d="M 6,12 L 18,18 C 23,7 36,2 50,5 C 60,8 67,14 68,25 C 67,36 60,42 50,45 C 36,48 23,43 18,32 L 6,38 L 14,25 Z" />
  ),

  // Zander — elongated, slightly deeper than pike
  "судак": (
    <path d="M 4,15 L 18,20 C 28,12 50,8 72,11 C 82,14 88,19 88,25 C 88,31 82,36 72,39 C 50,42 28,38 18,30 L 4,35 L 12,25 Z" />
  ),

  // Catfish — wide flat head tapering to tail, barbels
  "сом": (
    <>
      <path d="M 4,16 L 16,21 C 24,14 42,10 60,11 C 70,12 80,16 88,22 C 90,26 88,30 84,30 C 76,30 58,30 42,30 C 26,30 18,28 16,29 L 4,34 L 12,25 Z" />
      <path d="M 86,21 C 92,15 96,12 99,9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 87,24 C 94,23 98,22 101,22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 86,28 C 92,31 96,34 99,36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  // Trout — streamlined torpedo, small adipose fin near tail
  "форель": (
    <>
      <path d="M 4,14 L 18,20 C 28,12 50,8 70,11 C 82,14 90,19 90,25 C 90,31 82,36 70,39 C 50,42 28,38 18,30 L 4,36 L 14,25 Z" />
      <ellipse cx="30" cy="18" rx="6" ry="3" transform="rotate(-15 30 18)" />
    </>
  ),

  // Perch — spiky first dorsal fin integrated in silhouette outline
  "окунь": (
    <path d="M 4,16 L 18,21 C 24,17 26,14 28,20 L 30,11 L 34,19 L 38,9 L 42,17 L 46,8 L 50,16 C 56,14 62,13 64,15 C 74,17 82,21 82,26 C 82,32 74,36 62,38 C 44,42 26,38 18,30 L 4,36 L 13,26 Z" />
  ),

  // Grass carp — elongated torpedo, similar to zander
  "амур": (
    <path d="M 4,16 L 18,21 C 28,13 50,9 70,12 C 82,15 90,20 90,25 C 90,30 82,35 70,38 C 50,41 28,37 18,29 L 4,34 L 12,25 Z" />
  ),

  // Silver carp — stocky, disproportionately large blunt head
  "товстолоб": (
    <path d="M 4,15 L 18,20 C 26,11 44,7 62,10 C 72,12 82,16 90,21 C 92,25 90,30 86,32 C 78,34 62,36 44,37 C 30,37 20,34 18,30 L 4,35 L 13,25 Z" />
  ),

  // Generic fallback
  "generic": (
    <path d="M 4,15 L 18,20 C 28,12 50,8 70,12 C 82,15 90,20 90,25 C 90,30 82,35 70,38 C 50,42 28,38 18,30 L 4,35 L 13,25 Z" />
  ),
};

export default function FishIcon({ name, size = 20, color, className, style }: Props) {
  const shape = SHAPES[normalize(name)] ?? SHAPES.generic;
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 100 50"
      fill="currentColor"
      style={{ color, display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      className={className}
      aria-label={name}
      role="img"
    >
      {shape}
    </svg>
  );
}
