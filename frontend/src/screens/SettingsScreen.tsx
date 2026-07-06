import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import type { Language } from "../api/types";

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  async function changeLanguage(next: Language) {
    setLang(next);
    try {
      await api.updateSettings(next);
    } catch {
      /* best-effort; UI already reflects the change locally */
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

      <button className="btn btn-secondary" onClick={() => navigate("/")}>
        {t.home.backHome}
      </button>
    </div>
  );
}
