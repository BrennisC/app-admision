"use client";

import styles from "./DashboardSection.module.css";
import type { DashboardData } from "../shared/types";

export function DashboardSection({ dashboard, totalFallback, onGo }: {
  dashboard?: DashboardData;
  totalFallback?: number;
  onGo: (screen: string) => void;
}) {
  const cards = [
    { label: "Postulantes", value: dashboard?.postulantes ?? totalFallback ?? 0, hint: "Base consolidada", action: null as string | null },
    { label: "Inscripciones", value: dashboard?.inscripciones ?? 0, hint: "Ciclo activo", action: "inscripcion" },
    { label: "Órdenes pendientes", value: dashboard?.ordenesPendientes ?? 0, hint: "Deuda por cobrar", action: "tesoreria" },
    { label: "Pagos confirmados", value: dashboard?.pagos ?? 0, hint: "Movimientos de caja", action: "tesoreria" },
    { label: "Recaudación S/", value: dashboard?.recaudacion ?? 0, hint: "Conciliable con reportes", action: "tesoreria", money: true },
    { label: "Ingresantes", value: dashboard?.ingresantes ?? 0, hint: "Resultados finales", action: "resultados" },
  ];
  return (
    <>
      <section className={styles.grid} id="resumen" aria-label="Resumen">
        {cards.map((c) => (
          <article key={c.label} className={styles.card} style={{ cursor: c.action ? "pointer" : "default" }} onClick={() => c.action && onGo(c.action)}>
            <span>{c.label}</span>
            <strong>{c.money ? `S/ ${(c.value as number).toFixed(2)}` : new Intl.NumberFormat("es-PE").format(c.value as number)}</strong>
            <small>{c.hint}{c.action ? " → ir" : ""}</small>
          </article>
        ))}
      </section>
      <div className={styles.hint}>
        <p>Cada total se reconcilia con su reporte detallado en <b>Reportes</b> usando los mismos filtros. Flujo sugerido: <b>Postulante → Inscripción → Orden → Pago → Comprobante → Confirmación → Resultado</b>.</p>
      </div>
    </>
  );
}
