import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";

interface SessionSummary {
  totalScore: number;
  correctCount: number;
  totalRounds: number;
}

export default function SessionEndScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const summary = location.state as SessionSummary | null;

  useEffect(() => {
    refreshUser();
    if (!summary) navigate("/", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!summary) return null;

  return (
    <div className="screen screen-center">
      <h1>{t.sessionEnd.title}</h1>

      <div className="session-summary-card">
        <div className="summary-row">
          <span>{t.sessionEnd.correctCount}</span>
          <strong>
            {summary.correctCount}/{summary.totalRounds}
          </strong>
        </div>
        <div className="summary-row">
          <span>{t.sessionEnd.totalScore}</span>
          <strong>{summary.totalScore}</strong>
        </div>
      </div>

      <div className="button-stack">
        <button className="btn btn-primary" onClick={() => navigate("/game")}>
          {t.sessionEnd.playAgain}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          {t.sessionEnd.backHome}
        </button>
      </div>
    </div>
  );
}
