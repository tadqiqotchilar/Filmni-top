import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { AdminStats } from "../api/types";

export default function StatsPage({ onAuthError }: { onAuthError: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return onAuthError();
        setError("Statistikani yuklab bo'lmadi");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <p>Yuklanmoqda...</p>;

  return (
    <div className="stats-page">
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-value">{stats.totalUsers}</span>
          <span className="stat-label">Foydalanuvchilar</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{stats.totalSessions}</span>
          <span className="stat-label">Sessiyalar</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{stats.finishedSessions}</span>
          <span className="stat-label">Yakunlangan sessiyalar</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{stats.totalFilms}</span>
          <span className="stat-label">Filmlar</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{stats.totalFrames}</span>
          <span className="stat-label">Kadrlar</span>
        </div>
      </div>

      <h3>Top o'yinchilar</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Foydalanuvchi</th>
            <th>Ochko</th>
            <th>O'yinlar</th>
          </tr>
        </thead>
        <tbody>
          {stats.topPlayers.map((player, i) => (
            <tr key={player.id}>
              <td>{i + 1}</td>
              <td>{player.username ?? player.firstName ?? `#${player.id}`}</td>
              <td>{player.totalScore}</td>
              <td>{player.gamesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
