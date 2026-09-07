"use client";

import { useEffect, useState } from "react";
import { LoginScreen, type Session } from "./auth/LoginScreen";
import { ApplicantsDashboard } from "./applicants-dashboard";

const SESSION_KEY = "admision-session";

export type { SessionUser, Session } from "./auth/LoginScreen";

export function AdmissionApp() {
  const [session, setSession] = useState<Session>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          setSession(JSON.parse(stored) as Session);
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return <div className="app-loading">Preparando el sistema...</div>;
  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={(value) => {
          localStorage.setItem(SESSION_KEY, JSON.stringify(value));
          setSession(value);
        }}
      />
    );
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
