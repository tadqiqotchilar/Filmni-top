import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import type { Language } from "../api/types";
import { hapticSuccess, useTelegramBackButton } from "../telegram/telegram";

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useTelegramBackButton(() => navigate("/"));

  async function changeLanguage(next: Language) {
    setLang(next);
    try {
      await api.updateSettings(next);
    } catch {
      /* best-effort; UI already reflects the change locally */
    }
  }

  async function confirmReset() {
    setResetting(true);
    setResetError(null);
    try {
      await api.resetGame();
      await refreshUser();
      hapticSuccess();
      navigate("/");
    } catch {
      setResetError(t.settings.resetError);
      setResetting(false);
      setConfirmingReset(false);
    }
  }

  return (
    <div className="screen">
      <h1>{t.settings.title}</h1>

      <div className="settings-row">
        <span>{t.settings.language}</span>
        <div className="lang-toggle">
          <button className={lang === "uz" ? "tab tab-active" : "tab"} onClick={() => changeLanguage("uz")}>
            O'zbek
          </button>
          <button className={lang === "ru" ? "tab tab-active" : "tab"} onClick={() => changeLanguage("ru")}>
            Русский
          </button>
        </div>
      </div>

      <div className="settings-danger-zone">
        <h3>{t.settings.resetTitle}</h3>
        <p>{t.settings.resetDescription}</p>

        {!confirmingReset && (
          <button className="btn btn-danger" onClick={() => setConfirmingReset(true)}>
            {t.settings.resetButton}
          </button>
        )}

        {confirmingReset && (
          <div className="settings-reset-confirm">
            <p>{t.settings.resetConfirm}</p>
            <div className="settings-reset-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmingReset(false)} disabled={resetting}>
                {t.settings.cancel}
              </button>
              <button className="btn btn-danger" onClick={confirmReset} disabled={resetting}>
                {resetting ? t.settings.resetting : t.settings.resetButton}
              </button>
            </div>
          </div>
        )}

        {resetError && <p className="settings-reset-error">{resetError}</p>}
      </div>
    </div>
  );
}
