import { Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useI18n } from "./i18n";
import { useEffect } from "react";
import StagesScreen from "./screens/StagesScreen";
import StageFilmsScreen from "./screens/StageFilmsScreen";
import GameScreen from "./screens/GameScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import SettingsScreen from "./screens/SettingsScreen";

function App() {
  const { user, loading, error } = useAuth();
  const { t, setLang } = useI18n();

  useEffect(() => {
    if (user) setLang(user.language);
  }, [user, setLang]);

  if (loading) {
    return (
      <div className="screen screen-center">
        <p>{t.game.loading}</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="screen screen-center">
        <p>Telegram orqali ochilmadi. Iltimos, botdan qayta urinib ko'ring.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<StagesScreen />} />
      <Route path="/stages" element={<StagesScreen />} />
      <Route path="/stages/:stage" element={<StageFilmsScreen />} />
      <Route path="/stages/:stage/play/:filmId" element={<GameScreen />} />
      <Route path="/leaderboard" element={<LeaderboardScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Routes>
  );
}

export default App;
