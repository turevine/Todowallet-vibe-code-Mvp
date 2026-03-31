export interface DesignPreset {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
  accentColor: string;           // 히트맵 채운 원 색상
  patternClass?: string;
  limited?: string;
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "midnight",
    name: "미드나이트",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    textColor: "#E8E8FF",
    accentColor: "#A5A0FF",
    patternClass: "card-grid-pattern",
  },
  {
    id: "aurora",
    name: "오로라",
    gradient: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #1e3a5f 100%)",
    textColor: "#A8FFCE",
    accentColor: "#6BCB77",
    patternClass: "card-grid-pattern",
  },
  {
    id: "obsidian-gold",
    name: "오브시디안 골드",
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #1a0208 100%)",
    textColor: "#93C5FD",
    accentColor: "#60A5FA",
    patternClass: "card-wave-pattern",
  },
  {
    id: "crimson-night",
    name: "크림슨 나이트",
    gradient: "linear-gradient(135deg, #1a0a0a 0%, #3d0c02 50%, #1a0505 100%)",
    textColor: "#FFB5A7",
    accentColor: "#FF8A7A",
    patternClass: "card-wave-pattern",
  },
  {
    id: "steel-blue",
    name: "스틸 블루",
    gradient: "linear-gradient(135deg, #0d1b2a 0%, #1c3d5a 50%, #0a2540 100%)",
    textColor: "#90CDF4",
    accentColor: "#63B3ED",
    patternClass: "card-grid-pattern",
  },
  {
    id: "holographic",
    name: "홀로그래픽",
    gradient: "linear-gradient(135deg, #1a0533 0%, #0a1628 25%, #0d2b1f 50%, #1a0d05 75%, #1a0533 100%)",
    textColor: "#FFE5F0",
    accentColor: "#F9A8D4",
    patternClass: "card-holographic card-grid-pattern",
    limited: "한정판",
  },
];

export const DEFAULT_PRESET_ID = "midnight";

export function getPreset(id: string): DesignPreset {
  return DESIGN_PRESETS.find(p => p.id === id) || DESIGN_PRESETS[0];
}
