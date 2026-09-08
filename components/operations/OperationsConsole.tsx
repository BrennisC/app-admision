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

const SCREENS: { id: Screen; label: string; step: string }[] = [
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
}: {
  token: string;
  role?: string;
}) {
  const [screen, setScreen] = useState<Screen>("inscripcion");
  const [resources, setResources] = useState<Resources>(EMPTY_RESOURCES);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  }>();
  const [loading, setLoading] = useState(true);

  const visibleScreens = SCREENS.filter((item) => {
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
  });

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
    ];
    try {
      const [
        catalogos,
        inscripciones,
        ordenes,
        cajas,
        pagos,
        resultados,
        dashboard,
      ] = await Promise.all(paths.map((p) => api<unknown>(p)));
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
        catalogos: catalogos as Catalogs,
        inscripciones: inscripciones as Row[],
        ordenes: ordenes as Row[],
        cajas: cajas as Row[],
        pagos: pagos as Row[],
        resultados: resultados as Row[],
        auditoria,
        usuarios,
        dashboard: dashboard as Row,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las operaciones",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const openScreen = (event: Event) =>
      setScreen((event as CustomEvent<Screen>).detail);
    window.addEventListener("open-operation", openScreen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("open-operation", openScreen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <section className={styles.panel} id="operaciones">
      <div className={styles.header}>
        <div>
          <span className="eyebrow">Flujo operativo</span>
          <h2>Procesar admisión</h2>
        </div>
        <span className={styles.sync}>
          {loading ? "Sincronizando..." : "Datos actualizados"}
        </span>
      </div>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Módulos del sistema"
      >
        {visibleScreens.map((item) => (
          <button
            key={item.id}
            className={screen === item.id ? styles.active : ""}
            onClick={() => {
              setScreen(item.id);
              setNotice(undefined);
            }}
            role="tab"
            aria-selected={screen === item.id}
          >
            <span>{item.step}</span>
            {item.label}
          </button>
        ))}
      </div>
      {notice && (
        <div
          className={`${styles.notice} ${notice.tone === "success" ? styles.success : styles.error}`}
          role="status"
        >
          {notice.text}
        </div>
      )}
      <div className={styles.screen}>
        {screen === "postulante" && <ApplicantForm submit={submit} />}
        {screen === "inscripcion" && (
          <EnrollmentSection resources={resources} api={api} submit={submit} />
        )}
        {screen === "ordenes" && <OrdersSection orders={resources.ordenes} />}
        {screen === "tesoreria" && (
          <TreasurySection resources={resources} api={api} submit={submit} />
        )}
        {screen === "resultados" && (
          <ResultsSection resources={resources} submit={submit} />
        )}
        {screen === "catalogos" && (
          <CatalogsSection catalogs={resources.catalogos} submit={submit} />
        )}
        {screen === "usuarios" && (
          <UsersSection rows={resources.usuarios} submit={submit} />
        )}
        {screen === "auditoria" && <AuditSection rows={resources.auditoria} />}
      </div>
    </section>
  );
}
