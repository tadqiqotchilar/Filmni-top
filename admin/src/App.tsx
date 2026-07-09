import { useState } from "react";
import { setAuthToken } from "./api/client";
import type { AdminFilm } from "./api/types";
import LoginPage from "./pages/LoginPage";
import FilmsPage from "./pages/FilmsPage";
import FilmDetailPage from "./pages/FilmDetailPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

const TOKEN_KEY = "filmni-admin:token";

function readStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) setAuthToken(token);
  return token;
}

function App() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [tab, setTab] = useState<"films" | "stats" | "settings">("films");
  const [selectedFilm, setSelectedFilm] = useState<AdminFilm | null>(null);

  function handleLogin(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setAuthToken(newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setSelectedFilm(null);
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Filmni Top — Admin</h1>
        <nav>
          <button
            className={tab === "films" && !selectedFilm ? "active" : ""}
            onClick={() => {
              setTab("films");
              setSelectedFilm(null);
            }}
          >
            Filmlar
          </button>
          <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
            Statistika
          </button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
            Sozlamalar
          </button>
        </nav>
        <button onClick={handleLogout}>Chiqish</button>
      </header>

      <main>
        {tab === "films" &&
          (selectedFilm ? (
            <FilmDetailPage
              film={selectedFilm}
              onAuthError={handleLogout}
              onBack={() => setSelectedFilm(null)}
            />
          ) : (
            <FilmsPage onAuthError={handleLogout} onSelectFilm={setSelectedFilm} />
          ))}
        {tab === "stats" && <StatsPage onAuthError={handleLogout} />}
        {tab === "settings" && <SettingsPage onAuthError={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
