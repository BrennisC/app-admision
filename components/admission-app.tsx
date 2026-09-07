"use client";

import { useEffect, useState } from "react";
import { ApplicantsDashboard } from "./applicants-dashboard";

export interface SessionUser {
  sub: number;
  username: string;
  name: string;
  role: string;
}

interface Session {
  accessToken: string;
  user: SessionUser;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SESSION_KEY = "admision-session";

export function AdmissionApp() {
  const [session, setSession] = useState<Session>();
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try { setSession(JSON.parse(stored) as Session); } catch { localStorage.removeItem(SESSION_KEY); }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return <div className="app-loading">Preparando el sistema...</div>;
  if (!session) {
    return <LoginScreen onAuthenticated={(value) => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value));
      setSession(value);
    }} />;
  }

  return (
    <ApplicantsDashboard
      token={session.accessToken}
      user={session.user}
      onLogout={() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(undefined);
      }}
    />
  );
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [username, setUsername] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json() as Session & { message?: string };
      if (!response.ok) throw new Error(body.message ?? "No se pudo iniciar la sesión");
      onAuthenticated(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo conectar con la API");
    } finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="login-seal">UA</div>
        <span>Sistema institucional</span>
        <h1>Admisión que se puede verificar.</h1>
        <p>Postulantes, inscripciones y tesorería en un único flujo operativo con trazabilidad.</p>
        <div className="login-flow" aria-label="Flujo del sistema">
          <span>Identidad</span><i />
          <span>Inscripción</span><i />
          <span>Pago</span><i />
          <span>Resultado</span>
        </div>
      </section>
      <section className="login-card-wrap">
        <form className="login-card" onSubmit={submit}>
          <span className="eyebrow">Acceso seguro</span>
          <h2>Iniciar sesión</h2>
          <p>Ingresa tus credenciales asignadas.</p>
          <label>Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
          <label>
            Contraseña

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
              />

              <button
                type="button"
                className="password-eye"
  
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? "Validando..." : "Ingresar al sistema"}</button>
          <small>Acceso inicial local: admin / Admin123!</small>
        </form>
      </section>
    </main>
  );
}
