"use client";

import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
import { NavIcon } from "../shared/ui";
import { initials } from "../shared/api";
import type { SessionUser } from "../auth/LoginScreen";

export type AppSection =
  | "resumen"
  | "postulantes"
  | "inscripciones"
  | "tesoreria"
  | "resultados"
  | "catalogos"
  | "usuarios"
  | "auditoria"
  | "reportes";

export const SECTION_TITLES: Record<
  AppSection,
  { eyebrow: string; title: string }
> = {
  resumen: { eyebrow: "Visión general", title: "Resumen operativo" },
  postulantes: { eyebrow: "Proceso de admisión", title: "Postulantes" },
  inscripciones: { eyebrow: "Proceso de admisión", title: "Inscripciones" },
  tesoreria: { eyebrow: "Tesorería", title: "Caja y pagos" },
  resultados: { eyebrow: "Proceso de admisión", title: "Resultados" },
  catalogos: { eyebrow: "Proceso de admisión", title: "Catálogos" },
  usuarios: { eyebrow: "Sistema", title: "Usuarios" },
  auditoria: { eyebrow: "Sistema", title: "Auditoría" },
  reportes: { eyebrow: "Trazabilidad", title: "Reportes y conciliación" },
};

function canSee(user: SessionUser, module: string): boolean {
  const role = user.role;
  if (!role || role === "ADMIN") return true;
  switch (module) {
    case "inscripciones":
    case "catalogos":
      return role === "ADMISION";
    case "tesoreria":
      return role === "TESORERIA" || role === "CAJERO";
    case "resultados":
      return role === "ADMISION" || role === "CONSULTA";
    case "auditoria":
      return role === "TESORERIA" || role === "CAJERO";
    case "usuarios":
      return false;
    default:
      return true;
  }
}

interface Props {
  section: AppSection;
  onSection: (s: AppSection) => void;
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
            <img src="/admision.svg" alt="UA" />
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
          {canSee(user, "inscripciones") && (
            <a
              href="#inscripciones"
              className={section === "inscripciones" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("inscripciones");
              }}
            >
              <NavIcon name="file" />
              Inscripciones
            </a>
          )}
          {canSee(user, "catalogos") && (
            <a
              href="#catalogos"
              className={section === "catalogos" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("catalogos");
              }}
            >
              <NavIcon name="book" />
              Catálogos
            </a>
          )}
          {canSee(user, "resultados") && (
            <a
              href="#resultados"
              className={section === "resultados" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("resultados");
              }}
            >
              <NavIcon name="chart" />
              Resultados
            </a>
          )}
          <p>Tesorería</p>
          {canSee(user, "tesoreria") && (
            <a
              href="#tesoreria"
              className={section === "tesoreria" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("tesoreria");
              }}
            >
              <NavIcon name="wallet" />
              Caja y pagos
            </a>
          )}
          {(canSee(user, "usuarios") || canSee(user, "auditoria")) && (
            <p>Sistema</p>
          )}
          {canSee(user, "usuarios") && (
            <a
              href="#usuarios"
              className={section === "usuarios" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("usuarios");
              }}
            >
              <NavIcon name="users" />
              Usuarios
            </a>
          )}
          {canSee(user, "auditoria") && (
            <a
              href="#auditoria"
              className={section === "auditoria" ? styles.active : ""}
              onClick={(e) => {
                e.preventDefault();
                onSection("auditoria");
              }}
            >
              <NavIcon name="file" />
              Auditoría
            </a>
          )}
        </nav>
        <div className={styles.footer}>
          <div className={styles.session}>
            <span className={styles.sessionAvatar} aria-hidden="true">
              {initials(user.name, "")}
            </span>
            <span className={styles.sessionInfo}>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
          </div>
          <button type="button" className={styles.logout} onClick={onLogout}>
            <NavIcon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
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
