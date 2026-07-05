import { useEffect, useState } from "react";
import { api, ApiError, frameImageUrl } from "../api/client";
import type { AdminFilm, AdminFrame, Difficulty } from "../api/types";

export default function FilmDetailPage({
  film,
  onAuthError,
  onBack,
}: {
  film: AdminFilm;
  onAuthError: () => void;
  onBack: () => void;
}) {
  const [frames, setFrames] = useState<AdminFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { film: full } = await api.getFilm(film.id);
      setFrames(full.frames ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Kadrlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film.id]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadFrame(film.id, file, difficulty);
      setFile(null);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Kadr yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  }

  async function handleDifficultyChange(frame: AdminFrame, nextDifficulty: Difficulty) {
    try {
      await api.updateFrame(frame.id, { difficulty: nextDifficulty });
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Kadrni yangilab bo'lmadi");
    }
  }

  async function handleReactivate(frame: AdminFrame) {
    try {
      await api.updateFrame(frame.id, { isActive: true });
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Kadrni yangilab bo'lmadi");
    }
  }

  async function handleDelete(frame: AdminFrame) {
    if (!confirm("Kadrni o'chirmoqchimisiz?")) return;
    setError(null);
    setInfo(null);
    try {
      const { softDeleted } = await api.deleteFrame(frame.id);
      if (softDeleted) {
        setInfo("Bu kadr o'yin tarixida ishlatilgan, shuning uchun butunlay o'chirilmadi — faqat yashirildi (yangi o'yinlarda ko'rsatilmaydi).");
      }
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Kadrni o'chirib bo'lmadi");
    }
  }

  return (
    <div className="film-detail-page">
      <div className="page-header">
        <button onClick={onBack}>&larr; Filmlarga qaytish</button>
        <h2>{film.titleOriginal} — kadrlar</h2>
      </div>

      {error && <p className="error-text">{error}</p>}
      {info && <p className="info-text">{info}</p>}

      <form className="upload-form" onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
          <option value="easy">Oson</option>
          <option value="medium">O'rta</option>
          <option value="hard">Qiyin</option>
        </select>
        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Yuklanmoqda..." : "Kadr qo'shish"}
        </button>
      </form>

      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <div className="frame-grid">
          {frames.map((frame) => (
            <div key={frame.id} className={`frame-card ${frame.isActive ? "" : "row-inactive"}`}>
              <img src={frameImageUrl(frame.imageUrl)} alt="" />
              <select
                value={frame.difficulty}
                onChange={(e) => handleDifficultyChange(frame, e.target.value as Difficulty)}
              >
                <option value="easy">Oson</option>
                <option value="medium">O'rta</option>
                <option value="hard">Qiyin</option>
              </select>
              <div className="row-actions">
                {frame.isActive ? (
                  <button onClick={() => handleDelete(frame)}>O'chirish</button>
                ) : (
                  <button onClick={() => handleReactivate(frame)}>Faollashtirish</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
