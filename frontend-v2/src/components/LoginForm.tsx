import { useState, type FormEvent } from "react";
import { useAuthStore } from "../stores/authStore";

export default function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email.trim(), password);
    } catch {
      // error surfaced via store
    }
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center p-4"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-md"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-rest)",
        }}
      >
        <div className="mb-4">
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: -0.3,
              color: "var(--text)",
            }}
          >
            Taskhauler
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}
          >
            Sign in to your account
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-2)",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              className="outline-none transition-colors focus:border-[var(--accent)]"
              style={{
                height: 32,
                padding: "0 10px",
                fontSize: 13,
                color: "var(--text)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-2)",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="outline-none transition-colors focus:border-[var(--accent)]"
              style={{
                height: 32,
                padding: "0 10px",
                fontSize: 13,
                color: "var(--text)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color: "var(--red)",
                background:
                  "color-mix(in srgb, var(--red) 8%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--red) 30%, var(--border))",
                padding: "8px 10px",
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="transition-opacity disabled:opacity-50"
            style={{
              height: 34,
              background: "var(--accent)",
              color: "var(--accent-fg)",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {import.meta.env.DEV && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                border: "1px dashed var(--border)",
                borderRadius: 6,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--text-2)" }}>
                Dev hint
              </div>
              <div>admin@taskhauler.localhost / admin</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
