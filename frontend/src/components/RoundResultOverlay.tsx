import type { AnswerResponse } from "../api/types";
import { useI18n } from "../i18n";

interface RoundResultOverlayProps {
  result: AnswerResponse;
  onNext: () => void;
}

export default function RoundResultOverlay({ result, onNext }: RoundResultOverlayProps) {
  const { t } = useI18n();

  const heading = result.timedOut ? t.result.timedOut : result.isCorrect ? t.result.correct : t.result.incorrect;

  return (
    <div className="overlay">
      <div className={`overlay-card ${result.isCorrect ? "overlay-correct" : "overlay-incorrect"}`}>
        <h2>{heading}</h2>

        {result.correctTitle && (
          <div className="overlay-film">
            {result.posterUrl && <img src={result.posterUrl} alt="" className="overlay-poster" />}
            <div>
              <p className="overlay-film-title">{result.correctTitle}</p>
              {result.year && <p className="overlay-film-year">{result.year}</p>}
            </div>
          </div>
        )}

        {typeof result.score === "number" && (
          <p className="overlay-score">
            {result.score >= 0 ? "+" : ""}
            {result.score} {t.result.points}
          </p>
        )}

        <button className="btn btn-primary" onClick={onNext} autoFocus>
          {t.result.next}
        </button>
      </div>
    </div>
  );
}
