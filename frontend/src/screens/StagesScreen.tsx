import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { StageDto } from "../api/types";
import { useI18n } from "../i18n";
import { GearIcon, TrophyIcon } from "../components/icons";

export default function StagesScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stages, setStages] = useState<StageDto[] | null>(null);

  useEffect(() => {
    api
      .getStages()
      .then((res) => setStages(res.stages))
      .catch(() => setStages([]));
  }, []);

  return (
    <div className="screen">
      <div className="home-topbar">
        <div>
          <h1>{t.appName}</h1>
          <p className="tagline">{t.home.tagline}</p>
        </div>
        <div className="icon-btn-row">
          <button className="icon-btn" aria-label={t.home.leaderboard} onClick={() => navigate("/leaderboard")}>
            <TrophyIcon />
          </button>
          <button className="icon-btn" aria-label={t.home.settings} onClick={() => navigate("/settings")}>
            <GearIcon />
          </button>
        </div>
      </div>

      <h2 className="section-title">{t.stages.title}</h2>

      {stages === null ? (
        <p>{t.game.loading}</p>
      ) : (
        <div className="stage-list">
          {stages.map((stage) => (
            <button
              key={stage.stage}
              className="stage-card"
              disabled={!stage.unlocked}
              onClick={() => navigate(`/stages/${stage.stage}`)}
            >
              <span className="stage-card-title">
                {t.stages.stageLabel} {stage.stage}
              </span>
              <span className="stage-card-progress">
                {stage.unlocked
                  ? `${stage.solvedCount}/${stage.totalFilms} ${t.stages.progress}`
                  : t.stages.locked}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
