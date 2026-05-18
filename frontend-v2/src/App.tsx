import { useEffect, useState } from "react";
import { useAuthStore } from "./stores/authStore";
import LoginForm from "./components/LoginForm";
import Board from "./components/board/Board";
import { applyTheme, getStoredTheme } from "./lib/theme";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Restore theme as early as possible — before any UI paints.
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setBooted(true));
  }, [fetchMe]);

  if (!booted) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{
          background: "var(--bg)",
          color: "var(--text-2)",
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LoginForm />
      </div>
    );
  }

  return <Board />;
}
