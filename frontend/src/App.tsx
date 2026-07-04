import { Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useI18n } from "./i18n";
import { useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import GameScreen from "./screens/GameScreen";
import SessionEndScreen from "./screens/SessionEndScreen";
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
      <Route path="/" element={<HomeScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="/session/:id/end" element={<SessionEndScreen />} />
      <Route path="/leaderboard" element={<LeaderboardScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Routes>
  );
}

export default App;
