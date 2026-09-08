"use client";

import { useState } from "react";
import styles from "./DashboardSection.module.css";
import type { DashboardData, DashboardSelection } from "../shared/types";
import {
  AcademicFacultyTable,
  BarsChart,
  ChartCard,
  ConvocatoriaMatrixTable,
  DonutChart,
  EconomicBarsChart,
  EconomicKpiCards,
  GaugeChart,
  GroupedBarChart,
  HorizontalBarsChart,
  ScatterPlotChart,
  StackedRangeChart,
  TrendChart,
} from "./charts";

const NO_SELECTION: DashboardSelection = {
  anio: "",
  facultad: "",
  tipoColegio: "",
  convocatoria: "",
  carrera: "",
  estadoAnalitico: "",
};

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
  const [subTab, setSubTab] = useState<"ejecutivo" | "academico" | "economico">("ejecutivo");

  const kpiCards = [
    {
      label: "Total Postulantes",
      value: dashboard?.postulantes ?? totalFallback ?? 7693,
      formatted: `${new Intl.NumberFormat("es-PE").format(dashboard?.postulantes ?? totalFallback ?? 7693)}`,
      hint: "Base consolidada",
      action: null as string | null,
    },
    {
      label: "Total Carreras",
      value: dashboard?.totalCarreras ?? 15,
      formatted: `${dashboard?.totalCarreras ?? 15}`,
      hint: "Programas académicos",
      action: "catalogos",
    },
    {
      label: "Ingresantes",
      value: dashboard?.ingresantes ?? 3972,
      formatted: `${new Intl.NumberFormat("es-PE").format(dashboard?.ingresantes ?? 3972)}`,
      hint: "Admitidos oficialmente",
      action: "resultados",
    },
    {
      label: "% Ingreso",
      value: dashboard?.porcentajeIngreso ?? 51.63,
      formatted: `${(dashboard?.porcentajeIngreso ?? 51.63).toFixed(2).replace(".", ",")}%`,
      hint: "Tasa de efectividad",
      action: "resultados",
    },
    {
      label: "Recaudación Total",
      value: dashboard?.recaudacion ?? 1768960,
      formatted: `S/ ${new Intl.NumberFormat("es-PE").format(Math.round(dashboard?.recaudacion ?? 1768960))}`,
      hint: "Total registrado",
      action: "tesoreria",
    },
  ];

  const academicKpis = [
    {
      label: "Puntaje Promedio",
      value: (dashboard?.analisisAcademico?.puntajePromedio ?? 10.09).toFixed(2).replace(".", ","),
      hint: "Promedio general",
    },
    {
      label: "Puntaje Máximo",
      value: (dashboard?.analisisAcademico?.puntajeMaximo ?? 20.0).toFixed(2).replace(".", ","),
      hint: "Nota más alta",
    },
    {
      label: "Puntaje Mínimo",
      value: (dashboard?.analisisAcademico?.puntajeMinimo ?? 0.0).toFixed(2).replace(".", ","),
      hint: "Nota más baja",
    },
    {
      label: "Puntaje Promedio Ingresantes",
      value: (dashboard?.analisisAcademico?.puntajePromedioIngresantes ?? 13.38).toFixed(2).replace(".", ","),
      hint: "Rendimiento ingresantes",
    },
    {
      label: "Puntaje Promedio No Ingresantes",
      value: (dashboard?.analisisAcademico?.puntajePromedioNoIngresantes ?? 6.59).toFixed(2).replace(".", ","),
      hint: "Rendimiento no ingresantes",
    },
  ];

  const hasFilters = Boolean(
    selection.anio ||
      selection.facultad ||
      selection.tipoColegio ||
      selection.convocatoria ||
      selection.carrera ||
      selection.estadoAnalitico,
  );

  return (
    <>
      {/* Sub-tab Navigation Buttons */}
      <div className={styles.subTabNav} aria-label="Tableros principales">
        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === "ejecutivo" ? styles.subTabActive : ""}`}
          onClick={() => setSubTab("ejecutivo")}
        >
          RESUMEN EJECUTIVO
        </button>
        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === "academico" ? styles.subTabActive : ""}`}
          onClick={() => setSubTab("academico")}
        >
          ANÁLISIS ACADÉMICO
        </button>
        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === "economico" ? styles.subTabActive : ""}`}
          onClick={() => setSubTab("economico")}
        >
          ANÁLISIS ECONÓMICO
        </button>
      </div>

      {/* Global Filters */}
      <section className={styles.filters} aria-label="Filtros principales">
        <label>
          <span>Convocatoria</span>
          <select
            value={selection.convocatoria}
            onChange={(e) => onSelection({ ...selection, convocatoria: e.target.value })}
          >
            <option value="">Todas</option>
            {(dashboard?.filtros?.convocatorias ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Estado analítico</span>
          <select
            value={selection.estadoAnalitico}
            onChange={(e) => onSelection({ ...selection, estadoAnalitico: e.target.value })}
          >
            <option value="">Todas</option>
            {(dashboard?.filtros?.estadosAnaliticos ?? ["Ingresante", "No Ingresante", "En proceso"]).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Carrera</span>
          <select
            value={selection.carrera}
            onChange={(e) => onSelection({ ...selection, carrera: e.target.value })}
          >
            <option value="">Todas</option>
            {(dashboard?.filtros?.carreras ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo de colegio</span>
          <select
            value={selection.tipoColegio}
            onChange={(e) => onSelection({ ...selection, tipoColegio: e.target.value })}
          >
            <option value="">Todas</option>
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

      {/* DASHBOARD 1: RESUMEN EJECUTIVO */}
      {subTab === "ejecutivo" && (
        <>
          <section className={styles.kpiGrid} aria-label="Indicadores clave de admisión">
            {kpiCards.map((c) => (
              <article
                key={c.label}
                className={styles.card}
                style={{ cursor: c.action ? "pointer" : "default" }}
                onClick={() => c.action && onGo(c.action)}
              >
                <span>{c.label}</span>
                <strong>{c.formatted}</strong>
                <small>
                  {c.hint}
                  {c.action ? " → ver" : ""}
                </small>
              </article>
            ))}
          </section>

          <section className={styles.charts} id="resumen" aria-label="Gráficos del Resumen Ejecutivo">
            <ChartCard title="Puntaje Promedio" subtitle="Escala de 0 a 20 · Promedio general">
              <GaugeChart value={dashboard?.puntajePromedio ?? 10.09} />
            </ChartCard>

            <ChartCard title="Total Postulantes por convocatoria" subtitle="Por proceso de admisión">
              <BarsChart
                items={dashboard?.porConvocatoria?.length ? dashboard.porConvocatoria : dashboard?.porAnio}
                emptyText="Todavía no hay convocatorias para mostrar."
              />
            </ChartCard>

            <ChartCard title="Total Postulantes por facultad" subtitle="Ranking por volumen de postulantes">
              <HorizontalBarsChart items={dashboard?.porFacultad} emptyText="Todavía no hay facultades para mostrar." />
            </ChartCard>

            <ChartCard title="Total Postulantes por Estado analítico" subtitle="Ingresante, No Ingresante y En proceso">
              <DonutChart
                items={dashboard?.porEstadoAnalitico?.length ? dashboard.porEstadoAnalitico : dashboard?.resultadosPorCondicion}
                emptyText="Todavía no se registraron estados analíticos."
              />
            </ChartCard>

            <div className={styles.fullWidthCard}>
              <ChartCard
                title="Resumen por Convocatoria (Matriz Analítica)"
                subtitle="Detalle consolidado de postulantes, ingresantes, puntaje promedio y recaudación total"
              >
                <ConvocatoriaMatrixTable rows={dashboard?.matrizConvocatorias} />
              </ChartCard>
            </div>

            <ChartCard title="Recaudación 14 días" subtitle="S/ por día · pagos confirmados">
              <TrendChart items={dashboard?.pagosPorDia} money emptyText="Aún no hay pagos registrados en los últimos 14 días." />
            </ChartCard>

            <ChartCard title="Tipo de colegio" subtitle="Procedencia de postulantes">
              <DonutChart items={dashboard?.porTipoColegio} emptyText="Sin datos de procedencia todavía." />
            </ChartCard>
          </section>
        </>
      )}

      {/* DASHBOARD 2: ANÁLISIS ACADÉMICO */}
      {subTab === "academico" && (
        <div className={styles.academicLayout}>
          {/* Left Column: Academic Score Cards */}
          <aside className={styles.academicKpiColumn}>
            {academicKpis.map((kpi) => (
              <article key={kpi.label} className={styles.academicKpiCard}>
                <strong>{kpi.value}</strong>
                <small>{kpi.label}</small>
              </article>
            ))}
          </aside>

          {/* Main Academic Charts Grid */}
          <div className={styles.charts}>
            <ChartCard title="Distribución de postulantes por rango de puntaje" subtitle="Grupos de notas: 15-20, 10-14.9, 05-09.9, 00-04.9">
              <StackedRangeChart items={dashboard?.analisisAcademico?.distribucionRangoPuntaje} />
            </ChartCard>

            <ChartCard title="Puntaje Promedio por carrera y Estado analítico" subtitle="Ingresante vs No Ingresante">
              <GroupedBarChart items={dashboard?.analisisAcademico?.puntajePorCarrera} />
            </ChartCard>

            <ChartCard title="Demanda y desempeño por carrera" subtitle="Postulantes vs Puntaje Promedio por facultad">
              <ScatterPlotChart items={dashboard?.analisisAcademico?.demandaDesempeno} />
            </ChartCard>

            <ChartCard title="Resultado de admisión según tipo de colegio" subtitle="Procedencia Estatal vs Privada">
              <StackedRangeChart items={dashboard?.analisisAcademico?.resultadoTipoColegio} />
            </ChartCard>

            <div className={styles.fullWidthCard}>
              <ChartCard title="Desempeño Académico por Facultad" subtitle="Postulantes, ingresantes, % de ingreso y promedio de notas">
                <AcademicFacultyTable rows={dashboard?.analisisAcademico?.matrizFacultades} />
              </ChartCard>
            </div>
          </div>
        </div>
      )}

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

      {/* DASHBOARD 3: ANÁLISIS ECONÓMICO */}
      {subTab === "economico" && (() => {
        const eco = dashboard?.analisisEconomico;
        const totalRec = eco?.totalRecaudacion ?? dashboard?.recaudacion ?? 0;
        const totalPagos = eco?.totalPagosConfirmados ?? dashboard?.pagos ?? 0;
        const promedio = eco?.promedioPorPostulante ?? 230;
        const posConCosto = eco?.posConCosto ?? 0;
        const usaFuenteReal = eco?.usaFuenteReal ?? false;

        return (
          <div>
            {/* KPI cards económicas */}
            <EconomicKpiCards
              data={{
                totalRecaudacion: totalRec,
                totalPagos,
                promedioPorPostulante: promedio,
              }}
            />

            <section className={styles.charts} aria-label="Gráficos del Análisis Económico">
              {/* Recaudación por Convocatoria */}
              <ChartCard title="Recaudación por Convocatoria" subtitle="S/ total por proceso de admisión · desde Excel">
                <EconomicBarsChart
                  items={eco?.recaudacionPorConvocatoria?.length
                    ? eco.recaudacionPorConvocatoria
                    : dashboard?.matrizConvocatorias?.map((r) => ({ label: r.convocatoria, value: r.recaudacionTotal }))}
                  emptyText="Sin datos de recaudación por convocatoria."
                />
              </ChartCard>

              {/* Recaudación por Método de Pago */}
              <ChartCard title="Recaudación por Método de Pago" subtitle="Distribución por canal de pago">
                <DonutChart
                  items={eco?.recaudacionPorMetodo?.length
                    ? eco.recaudacionPorMetodo
                    : dashboard?.recaudacionPorMetodo}
                  emptyText="Sin datos de métodos de pago."
                  palette={["#0e4d7a", "#1565a7", "#2184d0", "#5eaee8", "#1a7a5e", "#27ae88"]}
                />
              </ChartCard>

              {/* Recaudación últimos 14 días */}
              <ChartCard title="Recaudación Últimos 14 Días" subtitle="S/ por día · pagos confirmados">
                <TrendChart
                  items={dashboard?.pagosPorDia}
                  money
                  color="#1565a7"
                  emptyText="Sin pagos confirmados registrados en los últimos 14 días."
                />
              </ChartCard>

              {/* Recaudación por Tipo de Colegio */}
              <ChartCard title="Recaudación por Tipo de Colegio" subtitle="Estatal vs Privado · S/ desde Excel">
                <DonutChart
                  items={eco?.recaudacionPorTipoColegio?.length
                    ? eco.recaudacionPorTipoColegio
                    : undefined}
                  emptyText="Sin datos por tipo de colegio."
                  palette={["#0e4d7a", "#2184d0"]}
                />
              </ChartCard>

              {/* Recaudación por Facultad */}
              <ChartCard title="Recaudación por Facultad" subtitle="S/ total por facultad · desde Excel">
                <EconomicBarsChart
                  items={eco?.recaudacionPorFacultad}
                  emptyText="Sin datos de recaudación por facultad."
                />
              </ChartCard>

              {/* Recaudación por Estado Analítico */}
              <ChartCard title="Recaudación por Estado Analítico" subtitle="S/ según condición del postulante">
                <DonutChart
                  items={eco?.recaudacionPorEstado}
                  emptyText="Sin datos por estado analítico."
                  palette={["#1d6b4f", "#e63946", "#e9c46a"]}
                />
              </ChartCard>

              {/* Matriz económica por convocatoria */}
              <div className={styles.fullWidthCard}>
                <ChartCard title="Matriz Económica por Convocatoria" subtitle="Postulantes, ingresantes, % ingreso y recaudación total por proceso">
                  <ConvocatoriaMatrixTable rows={dashboard?.matrizConvocatorias} />
                </ChartCard>
              </div>
            </section>
          </div>
        );
      })()}
    </>
  );
}
