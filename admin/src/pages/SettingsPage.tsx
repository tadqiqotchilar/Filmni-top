import { useState } from "react";
import { api, ApiError } from "../api/client";
import Modal from "../components/Modal";
import type { AdminResetResult } from "../api/types";

const CONFIRM_WORD = "RESET";

export default function SettingsPage({ onAuthError }: { onAuthError: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminResetResult | null>(null);

  function openModal() {
    setConfirmText("");
    setError(null);
    setModalOpen(true);
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const res = await api.resetAll();
      setResult(res);
      setModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError();
      setError("O'yinni yangilab bo'lmadi");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-danger-card">
        <h3>O'yinni yangilash</h3>
        <p>
          Barcha foydalanuvchilarning ochkosi, bosqich progressi va o'yin tarixi 0 ga
          tushiriladi. Filmlar, kadrlar va foydalanuvchi hisoblari o'chirilmaydi. Bu amalni
          orqaga qaytarib bo'lmaydi.
        </p>
        <button className="btn-danger" onClick={openModal}>
          O'yinni yangilash
        </button>
      </div>

      {result && (
        <p className="info-text">
          Yangilandi: {result.usersReset} foydalanuvchi, {result.sessionsDeleted} sessiya,{" "}
          {result.progressDeleted} bosqich yozuvi, {result.weeklyScoresDeleted} haftalik ochko
          tozalandi.
        </p>
      )}

      {modalOpen && (
        <Modal title="O'yinni yangilashni tasdiqlang" onClose={() => setModalOpen(false)}>
          <p>
            Bu amal BARCHA foydalanuvchilarning natijalarini butunlay 0 ga tushiradi va
            qaytarib bo'lmaydi. Davom etish uchun quyiga <strong>{CONFIRM_WORD}</strong> deb
            yozing.
          </p>
          <label>
            Tasdiqlash
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoFocus
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button onClick={() => setModalOpen(false)} disabled={resetting}>
              Bekor qilish
            </button>
            <button
              className="btn-danger"
              onClick={handleReset}
              disabled={resetting || confirmText !== CONFIRM_WORD}
            >
              {resetting ? "Yangilanmoqda..." : "Tasdiqlash va yangilash"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
