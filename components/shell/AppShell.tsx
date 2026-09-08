"use client";

import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
import { NavIcon } from "../shared/ui";
import { initials } from "../shared/api";
import type { SessionUser } from "../auth/LoginScreen";

export type AppSection = "resumen" | "postulantes" | "flujo" | "reportes";

export const SECTION_TITLES: Record<
  AppSection,
  { eyebrow: string; title: string }
> = {
  resumen: { eyebrow: "Visión general", title: "Resumen operativo" },
  postulantes: { eyebrow: "Proceso de admisión", title: "Postulantes" },
  flujo: { eyebrow: "Flujo operativo", title: "Procesar admisión" },
  reportes: { eyebrow: "Trazabilidad", title: "Reportes y conciliación" },
};

interface Props {
  section: AppSection;
  onSection: (s: AppSection, flowScreen?: string) => void;
  user: SessionUser;
  error?: string;
  sidebarNote: string;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({
  section,
  onSection,
  user,
  error,
  sidebarNote,
  onLogout,
  children,
}: Props) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.mark} aria-hidden="true">
            UA
          </div>
          <div>
            <strong>Admisión UNAS</strong>
            <span>Gestión académica</span>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <p>General</p>
          <a
            href="#resumen"
            className={section === "resumen" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              onSection("resumen");
            }}
          >
            <NavIcon name="grid" />
            Resumen
          </a>
          <a
            href="#reportes"
            className={section === "reportes" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              onSection("reportes");
            }}
          >
            <NavIcon name="chart" />
            Reportes
          </a>
          <p>Admisión</p>
          <a
            href="#postulantes"
            className={section === "postulantes" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              onSection("postulantes");
            }}
          >
            <NavIcon name="users" />
            Postulantes
          </a>
          <a
            href="#inscripciones"
            className={section === "flujo" ? styles.active : ""}
            onClick={(e) => {
              e.preventDefault();
              onSection("flujo", "inscripcion");
            }}
          >
            <NavIcon name="file" />
            Inscripciones
          </a>
          <a
            href="#catalogos"
            onClick={(e) => {
              e.preventDefault();
              onSection("flujo", "catalogos");
            }}
          >
            <NavIcon name="book" />
            Catálogos
          </a>
          <p>Tesorería</p>
          <a
            href="#tesoreria"
            onClick={(e) => {
              e.preventDefault();
              onSection("flujo", "tesoreria");
            }}
          >
            <NavIcon name="wallet" />
            Caja y pagos
          </a>
          <a
            href="#resultados"
            onClick={(e) => {
              e.preventDefault();
              onSection("flujo", "resultados");
            }}
          >
            <NavIcon name="chart" />
            Resultados
          </a>
        </nav>
      </aside>
      <main className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <span className="eyebrow">{SECTION_TITLES[section].eyebrow}</span>
            <h1>{SECTION_TITLES[section].title}</h1>
          </div>
          <div className={styles.actions}>
            <div className={styles.user}>
              <button
                className={styles.avatar}
                type="button"
                aria-label="Cerrar sesión"
                onClick={onLogout}
              >
                {initials(user.name, "")}
              </button>
              <span>
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
