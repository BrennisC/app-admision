"use client";

import { useEffect, useState } from "react";
import styles from "./OperationsConsole.module.css";
import { API_URL } from "../shared/api";
import type { Catalogs, Resources, Row } from "../shared/types";
import { ApplicantForm } from "./screens/ApplicantForm";
import { EnrollmentSection } from "./screens/EnrollmentSection";
import { OrdersSection } from "./screens/OrdersSection";
import { TreasurySection } from "./screens/TreasurySection";
import { ResultsSection } from "./screens/ResultsSection";
import { CatalogsSection } from "./screens/CatalogsSection";
import { UsersSection } from "./screens/UsersSection";
import { AuditSection } from "./screens/AuditSection";

export type Screen =
  | "postulante"
  | "inscripcion"
  | "ordenes"
  | "tesoreria"
  | "resultados"
  | "catalogos"
  | "usuarios"
  | "auditoria";

const EMPTY_RESOURCES: Resources = {
  catalogos: {
    convocatorias: [],
    facultades: [],
    carreras: [],
    conceptosPago: [],
  },
  inscripciones: [],
  ordenes: [],
  cajas: [],
  pagos: [],
  resultados: [],
  auditoria: [],
  usuarios: [],
  dashboard: {},
};

export type ModuleId =
  | "inscripciones"
  | "tesoreria"
  | "resultados"
  | "catalogos"
  | "usuarios"
  | "auditoria";

const MODULES: Record<
  ModuleId,
  { eyebrow: string; title: string; screens: Screen[] }
> = {
  inscripciones: {
    eyebrow: "Proceso de admisión",
    title: "Inscripciones",
    screens: ["postulante", "inscripcion", "ordenes"],
  },
  tesoreria: {
    eyebrow: "Tesorería",
    title: "Caja y pagos",
    screens: ["ordenes", "tesoreria"],
  },
  resultados: {
    eyebrow: "Proceso de admisión",
    title: "Resultados",
    screens: ["resultados"],
  },
  catalogos: {
    eyebrow: "Proceso de admisión",
    title: "Catálogos",
    screens: ["catalogos"],
  },
  usuarios: { eyebrow: "Sistema", title: "Usuarios", screens: ["usuarios"] },
  auditoria: { eyebrow: "Sistema", title: "Auditoría", screens: ["auditoria"] },
};

const SCREEN_META: { id: Screen; label: string; step: string }[] = [
  { id: "postulante", label: "Nuevo postulante", step: "01" },
  { id: "inscripcion", label: "Inscripción", step: "02" },
  { id: "ordenes", label: "Órdenes", step: "03" },
  { id: "tesoreria", label: "Caja y pago", step: "04" },
  { id: "resultados", label: "Resultados", step: "05" },
  { id: "catalogos", label: "Catálogos", step: "—" },
  { id: "usuarios", label: "Usuarios", step: "—" },
  { id: "auditoria", label: "Auditoría", step: "—" },
];

export function OperationsConsole({
  token,
  role,
  module,
  initialScreen,
}: {
  token: string;
  role?: string;
  module: ModuleId;
  initialScreen?: Screen;
}) {
  const meta = MODULES[module];
  const [screen, setScreen] = useState<Screen>(
    initialScreen ?? meta.screens[0],
  );
  const [resources, setResources] = useState<Resources>(EMPTY_RESOURCES);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  }>();
  const [loading, setLoading] = useState(true);

  const visibleScreens = SCREEN_META.filter(
    (item) =>
      meta.screens.includes(item.id) &&
      (() => {
        if (!role || role === "ADMIN") return true;
        if (role === "ADMISION")
          return [
            "postulante",
            "inscripcion",
            "resultados",
            "catalogos",
            "ordenes",
          ].includes(item.id);
        if (role === "TESORERIA" || role === "CAJERO")
          return ["ordenes", "tesoreria", "auditoria"].includes(item.id);
        return ["ordenes", "resultados", "auditoria"].includes(item.id);
      })(),
  );

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
    const body = (await response.json()) as T & { message?: string | string[] };
    if (!response.ok) {
      const message = Array.isArray(body.message)
        ? body.message.join(". ")
        : body.message;
      throw new Error(message ?? "La operación no pudo completarse");
    }
    return body;
  }

  async function refresh() {
    setLoading(true);
    const paths = [
      "/catalogos",
      "/inscripciones",
      "/ordenes-pago",
      "/cajas",
      "/pagos",
      "/resultados",
      "/dashboard",
    ] as const;
    const settled = await Promise.allSettled(paths.map((p) => api<unknown>(p)));
    const value = <T,>(index: number, fallback: T): T =>
      settled[index].status === "fulfilled" ? (settled[index].value as T) : fallback;
    const denied = settled
      .map((r, i) => ({ r, path: paths[i] }))
      .filter(({ r }) => r.status === "rejected")
      .map(({ path }) => path);
    let auditoria: Row[] = [];
    let usuarios: Row[] = [];
    try {
      auditoria = await api<Row[]>("/auditoria");
    } catch {
      /* Solo administradores. */
    }
    try {
      usuarios = await api<Row[]>("/usuarios");
    } catch {
      /* Solo administradores. */
    }
    setResources({
      catalogos: value<Catalogs>(0, EMPTY_RESOURCES.catalogos),
      inscripciones: value<Row[]>(1, []),
      ordenes: value<Row[]>(2, []),
      cajas: value<Row[]>(3, []),
      pagos: value<Row[]>(4, []),
      resultados: value<Row[]>(5, []),
      auditoria,
      usuarios,
      dashboard: value<Row>(6, {}),
    });
    if (denied.length) {
      const noAccess = denied.filter((p) => p === "/cajas" || p === "/pagos");
      setNotice({
        tone: "error",
        text:
          noAccess.length === denied.length
            ? "Tu rol no tiene acceso a caja y pagos; el resto de módulos cargó con normalidad."
            : `No se pudieron cargar: ${denied.join(", ")}`,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const openScreen = (event: Event) => {
      const next = (event as CustomEvent<Screen>).detail;
      if (meta.screens.includes(next)) setScreen(next);
    };
    window.addEventListener("open-operation", openScreen);
    return () => {
      window.removeEventListener("open-operation", openScreen);
    };
  }, [meta.screens]);

  async function submit(
    path: string,
    data: Row,
    success: string,
    method = "POST",
  ) {
    setNotice(undefined);
    try {
      await api(path, { method, body: JSON.stringify(data) });
      if (path === "/postulantes")
        window.dispatchEvent(new Event("postulantes-updated"));
      setNotice({ tone: "success", text: success });
      await refresh();
      return true;
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "La operación no pudo completarse",
      });
      return false;
    }
  }

  const activeScreen = visibleScreens.some((item) => item.id === screen)
    ? screen
    : (visibleScreens[0]?.id ?? meta.screens[0]);

  return (
    <section className={styles.panel} id="operaciones">
      <div className={styles.header}>
        <div>
          <span className="eyebrow">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
        </div>
        <span className={styles.sync}>
          {loading ? "Sincronizando..." : "Datos actualizados"}
        </span>
      </div>
      {visibleScreens.length > 1 && (
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Secciones del módulo"
        >
          {visibleScreens.map((item) => (
            <button
              key={item.id}
              className={activeScreen === item.id ? styles.active : ""}
              onClick={() => {
                setScreen(item.id);
                setNotice(undefined);
              }}
              role="tab"
              aria-selected={activeScreen === item.id}
            >
              <span>{item.step}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
      {notice && (
        <div
          className={`${styles.notice} ${notice.tone === "success" ? styles.success : styles.error}`}
          role="status"
        >
          {notice.text}
        </div>
      )}
      <div className={styles.screen}>
        {activeScreen === "postulante" && <ApplicantForm submit={submit} />}
        {activeScreen === "inscripcion" && (
          <EnrollmentSection resources={resources} api={api} submit={submit} />
        )}
        {activeScreen === "ordenes" && <OrdersSection orders={resources.ordenes} />}
        {activeScreen === "tesoreria" && (
          <TreasurySection resources={resources} api={api} submit={submit} />
        )}
        {activeScreen === "resultados" && (
          <ResultsSection resources={resources} submit={submit} />
        )}
        {activeScreen === "catalogos" && (
          <CatalogsSection catalogs={resources.catalogos} submit={submit} />
        )}
        {activeScreen === "usuarios" && (
          <UsersSection rows={resources.usuarios} submit={submit} />
        )}
        {activeScreen === "auditoria" && <AuditSection rows={resources.auditoria} />}
      </div>
    </section>
  );
}
