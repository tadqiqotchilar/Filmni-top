import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { LeaderboardResponse } from "../api/types";
import { useI18n } from "../i18n";

export default function LeaderboardScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"weekly" | "all">("all");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .leaderboard(period)
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="screen">
      <h1>{t.leaderboard.title}</h1>

      <div className="tab-row">
        <button className={`tab ${period === "all" ? "tab-active" : ""}`} onClick={() => setPeriod("all")}>
          {t.leaderboard.all}
        </button>
        <button className={`tab ${period === "weekly" ? "tab-active" : ""}`} onClick={() => setPeriod("weekly")}>
          {t.leaderboard.weekly}
        </button>
      </div>

      {loading && <p>{t.game.loading}</p>}

      {!loading && data && (
        <ol className="leaderboard-list">
          {data.entries.map((entry) => (
            <li key={entry.id} className="leaderboard-row">
              <span className="lb-rank">{entry.rank}</span>
              <span className="lb-name">{entry.firstName ?? entry.username ?? `#${entry.id}`}</span>
              <span className="lb-score">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}

      {!loading && data?.me && (
        <div className="leaderboard-me">
          {t.leaderboard.you}: #{data.me.rank} — {data.me.score}
        </div>
      )}

      <button className="btn btn-secondary" onClick={() => navigate("/")}>
        {t.sessionEnd.backHome}
      </button>
    </div>
  );
}
