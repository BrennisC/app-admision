"use client";

import { useState } from "react";
import styles from "./LoginScreen.module.css";
import { API_URL } from "../shared/api";

export interface SessionUser {
  sub: number;
  username: string;
  name: string;
  role: string;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
}

export function LoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}) {
  const [username, setUsername] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await response.json()) as Session & { message?: string };
      if (!response.ok)
        throw new Error(body.message ?? "No se pudo iniciar la sesión");
      onAuthenticated(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo conectar con la API",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div className={styles.seal}>UA</div>
        <span>Sistema institucional</span>
        <h1>Admisión que se puede verificar.</h1>
        <p>
          Postulantes, inscripciones y tesorería en un único flujo operativo con
          trazabilidad.
        </p>
        <div className={styles.flow} aria-label="Flujo del sistema">
          <span>Identidad</span>
          <i />
          <span>Inscripción</span>
          <i />
          <span>Pago</span>
          <i />
          <span>Resultado</span>
        </div>
      </section>
      <section className={styles.cardWrap}>
        <form className={styles.card} onSubmit={submit}>
          <span className="eyebrow">Acceso seguro</span>
          <h2>Iniciar sesión</h2>
          <p>Ingresa tus credenciales asignadas.</p>
          <label>
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Validando..." : "Ingresar al sistema"}
          </button>
          <small>Acceso inicial local: admin / Admin123!</small>
        </form>
      </section>
    </main>
  );
}
