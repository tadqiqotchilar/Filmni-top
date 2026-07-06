import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { StageDto } from "../api/types";
import { useI18n } from "../i18n";

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
      <h1>{t.stages.title}</h1>

      {stages === null ? (
        <p>{t.game.loading}</p>
      ) : (
        <div className="stage-list">
          {stages.map((stage) => (
            <button
              key={stage.stage}
              className={`stage-card ${stage.unlocked ? "" : "stage-locked"}`}
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

      <div className="button-stack">
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          {t.home.backHome}
        </button>
      </div>
    </div>
  );
}
