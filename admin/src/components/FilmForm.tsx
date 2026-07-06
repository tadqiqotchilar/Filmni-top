import { useState } from "react";
import type { AdminFilm, FilmInput } from "../api/types";

interface FilmFormProps {
  initial?: AdminFilm;
  onSubmit: (data: FilmInput & { isActive?: boolean }) => Promise<void>;
  onCancel: () => void;
}

export default function FilmForm({ initial, onSubmit, onCancel }: FilmFormProps) {
  const [titleOriginal, setTitleOriginal] = useState(initial?.titleOriginal ?? "");
  const [titleUz, setTitleUz] = useState(initial?.titleUz ?? "");
  const [titleRu, setTitleRu] = useState(initial?.titleRu ?? "");
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()));
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? "");
  const [stage, setStage] = useState(initial?.stage != null ? String(initial.stage) : "");
  const [aliasesText, setAliasesText] = useState((initial?.aliases ?? []).join("\n"));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        titleOriginal,
        titleUz,
        titleRu,
        year: Number(year),
        genre,
        posterUrl: posterUrl || undefined,
        stage: stage.trim() === "" ? null : Number(stage),
        aliases: aliasesText
          .split(/[\n,]/)
          .map((a) => a.trim())
          .filter(Boolean),
        ...(initial ? { isActive } : {}),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="film-form" onSubmit={handleSubmit}>
      <label>
        Asl nomi
        <input value={titleOriginal} onChange={(e) => setTitleOriginal(e.target.value)} required />
      </label>
      <label>
        O'zbekcha nomi
        <input value={titleUz} onChange={(e) => setTitleUz(e.target.value)} required />
      </label>
      <label>
        Ruscha nomi
        <input value={titleRu} onChange={(e) => setTitleRu(e.target.value)} required />
      </label>
      <label>
        Yili
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
      </label>
      <label>
        Janri
        <input value={genre} onChange={(e) => setGenre(e.target.value)} required />
      </label>
      <label>
        Poster URL (ixtiyoriy)
        <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} />
      </label>
      <label>
        Bosqich (ixtiyoriy)
        <input
          type="number"
          min="1"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          placeholder="masalan: 1"
        />
      </label>
      <label>
        Aliaslar (har birini yangi qatorga yozing)
        <textarea
          value={aliasesText}
          onChange={(e) => setAliasesText(e.target.value)}
          rows={4}
          placeholder={"masalan:\ntitanic\ntitanik"}
        />
      </label>
      {initial && (
        <label className="checkbox-label">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Faol (o'yinda ko'rsatiladi)
        </label>
      )}
      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
