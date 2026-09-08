"use client";

import styles from "./DashboardSection.module.css";
import type { DashboardData, DashboardSelection } from "../shared/types";
import { BarsChart, ChartCard, DonutChart, TrendChart } from "./charts";

const NO_SELECTION: DashboardSelection = { anio: "", facultad: "", tipoColegio: "" };

export function DashboardSection({
  dashboard,
  totalFallback,
  selection,
  onSelection,
  onGo,
}: {
  dashboard?: DashboardData;
  totalFallback?: number;
  selection: DashboardSelection;
  onSelection: (s: DashboardSelection) => void;
  onGo: (screen: string) => void;
}) {
  const cards = [
    {
      label: "Postulantes",
      value: dashboard?.postulantes ?? totalFallback ?? 0,
      hint: "Base consolidada",
      action: null as string | null,
    },
    {
      label: "Inscripciones",
      value: dashboard?.inscripciones ?? 0,
      hint: "Ciclo activo",
      action: "inscripcion",
    },
    {
      label: "Órdenes pendientes",
      value: dashboard?.ordenesPendientes ?? 0,
      hint: "Deuda por cobrar",
      action: "tesoreria",
    },
    {
      label: "Pagos confirmados",
      value: dashboard?.pagos ?? 0,
      hint: "Movimientos de caja",
      action: "tesoreria",
    },
    {
      label: "Recaudación S/",
      value: dashboard?.recaudacion ?? 0,
      hint: "Conciliable con reportes",
      action: "tesoreria",
      money: true,
    },
    {
      label: "Ingresantes",
      value: dashboard?.ingresantes ?? 0,
      hint: "Resultados finales",
      action: "resultados",
    },
  ];
  const hasFilters = Boolean(selection.anio || selection.facultad || selection.tipoColegio);
  return (
    <>
      <section className={styles.filters} aria-label="Filtros de gráficos">
        <label>
          <span>Año</span>
          <select
            value={selection.anio}
            onChange={(e) => onSelection({ ...selection, anio: e.target.value })}
          >
            <option value="">Todos</option>
            {(dashboard?.filtros?.anios ?? dashboard?.porAnio?.map((i) => i.label) ?? []).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Facultad</span>
          <select
            value={selection.facultad}
            onChange={(e) => onSelection({ ...selection, facultad: e.target.value })}
          >
            <option value="">Todos</option>
            {(dashboard?.filtros?.facultades ?? []).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo de colegio</span>
          <select
            value={selection.tipoColegio}
            onChange={(e) => onSelection({ ...selection, tipoColegio: e.target.value })}
          >
            <option value="">Todos</option>
            {(dashboard?.filtros?.tiposColegio ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.clearFilters}
          onClick={() => onSelection(NO_SELECTION)}
          disabled={!hasFilters}
          title={hasFilters ? "Quitar todos los filtros" : "No hay filtros aplicados"}
        >
          Limpiar
        </button>
      </section>
      <section className={styles.grid} id="resumen" aria-label="Resumen">
        {cards.map((c) => (
          <article
            key={c.label}
            className={styles.card}
            style={{ cursor: c.action ? "pointer" : "default" }}
            onClick={() => c.action && onGo(c.action)}
          >
            <span>{c.label}</span>
            <strong>
              {c.money
                ? `S/ ${(c.value as number).toFixed(2)}`
                : new Intl.NumberFormat("es-PE").format(c.value as number)}
            </strong>
            <small>
              {c.hint}
              {c.action ? " → ir" : ""}
            </small>
          </article>
        ))}
      </section>
      <section className={styles.charts} aria-label="Gráficos">
        <ChartCard title="Postulantes por año" subtitle="Por convocatoria · respeta facultad y colegio">
          <BarsChart items={dashboard?.porAnio} emptyText="Todavía no hay años para mostrar." />
        </ChartCard>
        <ChartCard
          title="Distribución de notas"
          subtitle={
            dashboard?.conPuntaje !== undefined
              ? `${new Intl.NumberFormat("es-PE").format(dashboard.conPuntaje)} con puntaje · ${new Intl.NumberFormat("es-PE").format(dashboard.sinPuntaje ?? 0)} sin puntaje`
              : "Puntaje de 0 a 20"
          }
        >
          <BarsChart items={dashboard?.distribucionPuntajes} emptyText="Todavía no hay puntajes registrados." />
        </ChartCard>
        <ChartCard title="Postulantes por facultad" subtitle="Top 8 · base histórica">
          <BarsChart items={dashboard?.porFacultad} emptyText="Todavía no hay facultades para mostrar." />
        </ChartCard>
        <ChartCard title="Recaudación 14 días" subtitle="S/ por día · pagos confirmados">
          <TrendChart items={dashboard?.pagosPorDia} money emptyText="Aún no hay pagos registrados en los últimos 14 días." />
        </ChartCard>
        <ChartCard title="Tipo de colegio" subtitle="Procedencia de postulantes">
          <DonutChart items={dashboard?.porTipoColegio} emptyText="Sin datos de procedencia todavía." />
        </ChartCard>
        <ChartCard title="Recaudación por método" subtitle="S/ por medio de pago">
          <BarsChart items={dashboard?.recaudacionPorMetodo} money emptyText="Registrá un pago en Caja y pagos para ver este gráfico." />
        </ChartCard>
        <ChartCard title="Inscripciones por estado" subtitle="Ciclo activo">
          <DonutChart items={dashboard?.porEstadoInscripcion} emptyText="Aún no hay inscripciones en el ciclo activo." />
        </ChartCard>
        <ChartCard title="Resultados por condición" subtitle="Ingresantes vs resto">
          <DonutChart items={dashboard?.resultadosPorCondicion} emptyText="Todavía no se registraron resultados." />
        </ChartCard>
      </section>
      <div className={styles.hint}>
        <p>
          Cada total se reconcilia con su reporte detallado en <b>Reportes</b>{" "}
          usando los mismos filtros. Flujo sugerido:{" "}
          <b>
            Postulante → Inscripción → Orden → Pago → Comprobante → Confirmación
            → Resultado
          </b>
          .
        </p>
      </div>
    </>
  );
}
