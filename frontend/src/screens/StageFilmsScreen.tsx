import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, frameImageUrl } from "../api/client";
import type { StageDto } from "../api/types";
import { useI18n } from "../i18n";

interface StageNavState {
  stageJustCompleted?: boolean;
  nextStageUnlocked?: boolean;
}

export default function StageFilmsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { stage: stageParam } = useParams<{ stage: string }>();
  const stage = Number(stageParam);

  const [stageDto, setStageDto] = useState<StageDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const banner = location.state as StageNavState | null;

  useEffect(() => {
    if (!Number.isInteger(stage)) {
      navigate("/stages", { replace: true });
      return;
    }
    api
      .getStages()
      .then((res) => {
        const found = res.stages.find((s) => s.stage === stage);
        if (!found || !found.unlocked) {
          navigate("/stages", { replace: true });
          return;
        }
        setStageDto(found);
      })
      .catch(() => setNotFound(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (notFound) {
    navigate("/stages", { replace: true });
    return null;
  }

  return (
    <div className="screen">
      <h1>
        {t.stages.stageLabel} {stage}
      </h1>

      {banner?.stageJustCompleted && (
        <div className="stage-banner">
          {t.stages.stageComplete}
          {banner.nextStageUnlocked && ` ${t.stages.nextUnlocked}`}
        </div>
      )}

      {!stageDto ? (
        <p>{t.game.loading}</p>
      ) : (
        <div className="film-grid">
          {stageDto.films.map((film, index) => (
            <div
              key={film.filmId}
              className={`film-tile ${film.solved ? "film-tile-solved" : ""}`}
              role={film.solved ? undefined : "button"}
              onClick={() => {
                if (!film.solved) navigate(`/stages/${stage}/play/${film.filmId}`);
              }}
            >
              {film.solved ? (
                <>
                  {film.posterUrl && (
                    <img src={frameImageUrl(film.posterUrl)} alt="" className="film-tile-poster" />
                  )}
                  <span className="film-tile-title">{film.title}</span>
                  <span className="film-tile-badge">{t.stages.foundLabel}</span>
                </>
              ) : (
                <span className="film-tile-position">{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" onClick={() => navigate("/stages")}>
        {t.stages.backToStages}
      </button>
    </div>
  );
}
