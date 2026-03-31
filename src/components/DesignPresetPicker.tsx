"use client";

import { DESIGN_PRESETS } from "@/constants/design-presets";

interface DesignPresetPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function DesignPresetPicker({
  selectedId,
  onSelect,
}: DesignPresetPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DESIGN_PRESETS.map((preset) => {
        const isSelected = preset.id === selectedId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`relative rounded-xl overflow-hidden transition-all ${
              isSelected
                ? "ring-2 ring-gray-900 ring-offset-2"
                : "ring-1 ring-gray-200"
            }`}
          >
            {/* gradient 미리보기 */}
            <div
              className={`aspect-[1.6/1] ${preset.patternClass ?? ""}`}
              style={{ background: preset.gradient }}
            >
              {/* 체크마크 */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#111"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}

              {/* 한정판 뱃지 */}
              {preset.limited && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[9px] font-medium" style={{ color: preset.textColor }}>
                  {preset.limited}
                </div>
              )}
            </div>

            {/* 이름 */}
            <div className="py-1.5 px-1 bg-white">
              <span className="text-[11px] font-medium text-gray-700">
                {preset.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
