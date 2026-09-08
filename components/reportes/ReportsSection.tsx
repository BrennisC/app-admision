"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ReportsSection.module.css";
import { API_URL, exportRowsToCsv } from "../shared/api";
import type { BreakdownItem, DashboardData } from "../shared/types";
import { BarsChart, ChartCard, DonutChart } from "../dashboard/charts";

function aggregate(rows: Record<string, string | number | null>[], field: string, amountField?: string): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[field] ?? "SIN DATO").trim().toUpperCase().slice(0, 40) || "SIN DATO";
    const amount = amountField ? Number(row[amountField]) : 1;
    if (!Number.isFinite(amount)) continue;
    totals.set(key, (totals.get(key) ?? 0) + (amountField ? Math.round(amount * 100) / 100 : 1));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
}

export function ReportsSection({
  token,
  dashboard,
}: {
  token: string;
  dashboard?: DashboardData;
}) {
  const [tab, setTab] = useState<"pagos" | "resultados" | "cajas">("pagos");
  const [rows, setRows] = useState<Record<string, string | number | null>[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const path =
          tab === "pagos"
            ? "/pagos"
            : tab === "resultados"
              ? "/resultados"
              : "/cajas";
        const res = await fetch(`${API_URL}${path}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`No se pudo cargar ${tab}`);
        setRows(await res.json());
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [tab, token]);

  const chart = useMemo(() => {
    if (!rows.length) return null;
    if (tab === "pagos") return { title: "Pagos por método", items: aggregate(rows, "metodo_pago", "monto"), money: true, donut: false };
    if (tab === "resultados") return { title: "Resultados por condición", items: aggregate(rows, "condicion"), money: false, donut: true };
    return { title: "Cajas por estado", items: aggregate(rows, "estado"), money: false, donut: true };
  }, [rows, tab]);

  const chartFallback = tab === "pagos" ? dashboard?.recaudacionPorMetodo : tab === "resultados" ? dashboard?.resultadosPorCondicion : undefined;

  return (
    <section className={styles.panel} id="reportes-panel">
      <div className={styles.header}>
        <div>
          <span className="eyebrow">Conciliación</span>
          <h2>Reportes esenciales</h2>
        </div>
        <button
          className="secondary-button"
          onClick={() => exportRowsToCsv(`reporte-${tab}.csv`, rows)}
          disabled={!rows.length}
        >
          Exportar CSV
        </button>
      </div>
      <div className={styles.tabs} role="tablist">
        {(["pagos", "resultados", "cajas"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? styles.active : ""}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
          >
            <span>{t === "pagos" ? "S/" : t === "resultados" ? "#" : "▦"}</span>
            {t === "pagos"
              ? "Pagos"
              : t === "resultados"
                ? "Resultados"
                : "Caja diaria"}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        {dashboard && (
          <p className={styles.summary}>
            Recaudación total S/ {dashboard.recaudacion.toFixed(2)} ·{" "}
            {dashboard.pagos} pagos · {dashboard.ordenesPendientes} órdenes
            pendientes.
          </p>
        )}
        {error && <div className={styles.error}>{error}</div>}
        {(chart ?? chartFallback) && !loading && (
          <div className={styles.chart}>
            <ChartCard title={chart?.title ?? "Distribución"} subtitle={chart?.money ? "Montos en soles" : "Conteo de registros"}>
              {chart?.donut || (!chart && chartFallback) ? (
                <DonutChart items={chart?.items ?? chartFallback} />
              ) : (
                <BarsChart items={chart?.items} money={chart?.money} />
              )}
            </ChartCard>
          </div>
        )}
        {loading ? (
          <div className={styles.empty}>Cargando {tab}…</div>
        ) : !rows.length ? (
          <div className={styles.empty}>Todavía no hay registros.</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  {Object.keys(rows[0])
                    .slice(0, 7)
                    .map((c) => (
                      <th key={c}>{c.replaceAll("_", " ")}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    {Object.keys(rows[0])
                      .slice(0, 7)
                      .map((c) => (
                        <td key={c}>{String(r[c] ?? "—")}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
