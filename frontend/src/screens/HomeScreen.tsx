import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="screen">
      <div className="home-header">
        <h1>{t.appName}</h1>
        <p className="tagline">{t.home.tagline}</p>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-value">{user?.totalScore ?? 0}</span>
          <span className="stat-label">{t.home.totalScore}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user?.gamesPlayed ?? 0}</span>
          <span className="stat-label">{t.home.gamesPlayed}</span>
        </div>
      </div>

      <div className="button-stack">
        <button className="btn btn-primary" onClick={() => navigate("/game")}>
          {t.home.play}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/leaderboard")}>
          {t.home.leaderboard}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/settings")}>
          {t.home.settings}
        </button>
      </div>
    </div>
  );
}
