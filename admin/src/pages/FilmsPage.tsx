import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { AdminFilm, FilmInput } from "../api/types";
import FilmForm from "../components/FilmForm";
import Modal from "../components/Modal";

export default function FilmsPage({
  onAuthError,
  onSelectFilm,
}: {
  onAuthError: () => void;
  onSelectFilm: (film: AdminFilm) => void;
}) {
  const [films, setFilms] = useState<AdminFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"none" | "create" | number>("none");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { films } = await api.listFilms();
      setFilms(films);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Filmlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(data: FilmInput) {
    try {
      await api.createFilm(data);
      setFormMode("none");
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Film qo'shib bo'lmadi");
    }
  }

  async function handleUpdate(id: number, data: FilmInput & { isActive?: boolean }) {
    try {
      await api.updateFilm(id, data);
      setFormMode("none");
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Filmni yangilab bo'lmadi");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Filmni o'chirmoqchimisiz?")) return;
    setError(null);
    setInfo(null);
    try {
      const { softDeleted } = await api.deleteFilm(id);
      if (softDeleted) {
        setInfo(
          "Bu film o'yin tarixida ishlatilgan, shuning uchun butunlay o'chirilmadi — faqat yashirildi (o'yinda ko'rsatilmaydi). Qayta faollashtirish uchun \"Tahrirlash\"dan foydalaning."
        );
      }
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("Filmni o'chirib bo'lmadi");
    }
  }

  const editingFilm = typeof formMode === "number" ? films.find((f) => f.id === formMode) : undefined;

  return (
    <div className="films-page">
      <div className="page-header">
        <h2>Filmlar</h2>
        <button onClick={() => setFormMode("create")}>+ Film qo'shish</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {info && <p className="info-text">{info}</p>}

      {formMode === "create" && (
        <Modal title="Film qo'shish" onClose={() => setFormMode("none")}>
          <FilmForm onSubmit={handleCreate} onCancel={() => setFormMode("none")} />
        </Modal>
      )}
      {editingFilm && (
        <Modal title="Filmni tahrirlash" onClose={() => setFormMode("none")}>
          <FilmForm
            initial={editingFilm}
            onSubmit={(data) => handleUpdate(editingFilm.id, data)}
            onCancel={() => setFormMode("none")}
          />
        </Modal>
      )}

      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Yili</th>
              <th>Janri</th>
              <th>Kadrlar</th>
              <th>Holat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {films.map((film) => (
              <tr key={film.id} className={film.isActive ? "" : "row-inactive"}>
                <td>{film.titleOriginal}</td>
                <td>{film.year}</td>
                <td>{film.genre}</td>
                <td>{film.frameCount}</td>
                <td>{film.isActive ? "faol" : "faol emas"}</td>
                <td className="row-actions">
                  <button onClick={() => onSelectFilm(film)}>Kadrlar</button>
                  <button onClick={() => setFormMode(film.id)}>Tahrirlash</button>
                  <button onClick={() => handleDelete(film.id)}>O'chirish</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
