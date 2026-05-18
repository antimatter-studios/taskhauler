import { useEffect, useState } from "react";
import { useAuthStore } from "./stores/authStore";
import KanbanBoard from "./components/KanbanBoard";
import LoginForm from "./components/LoginForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function readHashSlug(): string {
  const h = window.location.hash;
  if (!h || h === "#") return "";
  return h.startsWith("#") ? h.slice(1) : h;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const [booted, setBooted] = useState(false);
  const [slug, setSlug] = useState<string>(readHashSlug());

  useEffect(() => {
    fetchMe().finally(() => setBooted(true));
  }, [fetchMe]);

  useEffect(() => {
    function onHash() { setSlug(readHashSlug()); }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function handleBoardChange(newSlug: string) {
    if (newSlug !== slug) {
      window.location.hash = newSlug;
      setSlug(newSlug);
    }
  }

  if (!booted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary" />
          <span className="text-sm font-semibold">Taskhauler</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.display_name || user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <KanbanBoard initialSlug={slug} onBoardChange={handleBoardChange} />
      </main>
    </div>
  );
}
