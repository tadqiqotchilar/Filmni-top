import type { HintResponse, HintType } from "../api/types";
import { useI18n } from "../i18n";

const HINT_ORDER: HintType[] = ["firstLetter", "year", "genre", "lettersCount"];

interface HintPanelProps {
  hintsUsed: HintResponse[];
  onUseHint: (hintType: HintType) => void;
  disabled: boolean;
}

export default function HintPanel({ hintsUsed, onUseHint, disabled }: HintPanelProps) {
  const { t } = useI18n();
  const usedTypes = new Set(hintsUsed.map((h) => h.hintType));

  const labels: Record<HintType, string> = {
    firstLetter: t.game.hintFirstLetter,
    year: t.game.hintYear,
    genre: t.game.hintGenre,
    lettersCount: t.game.hintLettersCount,
  };

  return (
    <div className="hint-panel">
      <div className="hint-buttons">
        {HINT_ORDER.map((type) => (
          <button
            key={type}
            className="btn btn-hint"
            disabled={disabled || usedTypes.has(type)}
            onClick={() => onUseHint(type)}
          >
            {labels[type]}
          </button>
        ))}
      </div>

      {hintsUsed.length > 0 && (
        <div className="hint-values">
          {hintsUsed.map((h) => (
            <span key={h.hintType} className="hint-value-chip">
              {String(h.value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
