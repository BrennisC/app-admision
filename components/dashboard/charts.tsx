"use client";

import { useState } from "react";
import styles from "./charts.module.css";
import type { BreakdownItem, ConvocatoriaSummaryRow } from "../shared/types";

const PALETTE = ["#123f32", "#1d6b4f", "#3d9a6c", "#7cc79b", "#c3e6cd", "#e8d44d", "#d9a441", "#b0562f"];


function maxValue(items: BreakdownItem[]): number {
  return Math.max(1, ...items.map((i) => i.value));
}

function short(label: string, length = 14): string {
  const clean = label.trim() || "Sin dato";
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

function formatValue(value: number, money: boolean): string {
  if (money) return `S/ ${value.toFixed(2)}`;
  return new Intl.NumberFormat("es-PE").format(value);
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <article className={styles.card}>
      <header>
        <strong className={styles.cardTitle}>{title}</strong>
        {subtitle && <small className={styles.cardSubtitle}>{subtitle}</small>}
      </header>
      {children}
    </article>
  );
}

export function EmptyChart({ text = "Sin datos todavía" }: { text?: string }) {
  return <p className={styles.empty}>{text}</p>;
}

export function GaugeChart({ value = 10.09 }: { value?: number }) {
  const safeValue = Math.min(20, Math.max(0, value));
  const angleDeg = 180 - (safeValue / 20) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const nx = 50 + 32 * Math.cos(angleRad);
  const ny = 50 - 32 * Math.sin(angleRad);

  return (
    <div className={styles.gaugeContainer}>
      <svg className={styles.gaugeSvg} viewBox="0 0 100 58" role="img" aria-label={`Puntaje Promedio: ${safeValue.toFixed(2)}`}>
        <path d="M 12 50 A 38 38 0 0 1 50 12" fill="none" stroke="#e63946" strokeWidth="12" strokeLinecap="round" />
        <path d="M 50 12 A 38 38 0 0 1 80.7 27.6" fill="none" stroke="#e9c46a" strokeWidth="12" />
        <path d="M 80.7 27.6 A 38 38 0 0 1 88 50" fill="none" stroke="#2a9d8f" strokeWidth="12" strokeLinecap="round" />
        <line x1="50" y1="50" x2={nx.toFixed(2)} y2={ny.toFixed(2)} stroke="#1d2d27" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="4.5" fill="#1d2d27" />
        <circle cx="50" cy="50" r="2" fill="#ffffff" />
      </svg>
      <div className={styles.gaugeValue}>{safeValue.toFixed(2)}</div>
      <div className={styles.gaugeScale}>
        <span>0</span>
        <span>10</span>
        <span>20</span>
      </div>
    </div>
  );
}

export function BarsChart({
  items,
  money = false,
  emptyText,
}: {
  items?: BreakdownItem[];
  money?: boolean;
  emptyText?: string;
}) {
  const [tooltip, setTooltip] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const max = maxValue(items);
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras" style={{ position: "relative" }}>
      {tooltip && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong>
          <span>{formatValue(tooltip.value, money)}</span>
        </div>
      )}
      {items.map((item, i) => (
        <div key={item.label} className={styles.barRow}>
          <span className={styles.barLabel} title={item.label}>
            {short(item.label)}
          </span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.interactiveBar}`}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('[role="img"]') as HTMLElement)?.getBoundingClientRect();
                const el = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: item.label, value: item.value, x: el.right - (rect?.left ?? 0) + 6, y: el.top - (rect?.top ?? 0) - 4 });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </div>
          <b className={styles.barValue}>{formatValue(item.value, money)}</b>
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarsChart({
  items,
  money = false,
  emptyText,
}: {
  items?: BreakdownItem[];
  money?: boolean;
  emptyText?: string;
}) {
  const [tooltip, setTooltip] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const max = maxValue(items);
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras horizontales por facultad" style={{ position: "relative" }}>
      {tooltip && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong>
          <span>{formatValue(tooltip.value, money)}</span>
        </div>
      )}
      {items.map((item) => (
        <div key={item.label} className={styles.barRow} style={{ gridTemplateColumns: "140px 1fr auto" }}>
          <span className={styles.barLabel} title={item.label}>
            {short(item.label, 24)}
          </span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.interactiveBar}`}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: "#1d6b4f" }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('[role="img"]') as HTMLElement)?.getBoundingClientRect();
                const el = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: item.label, value: item.value, x: el.right - (rect?.left ?? 0) + 6, y: el.top - (rect?.top ?? 0) - 4 });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </div>
          <b className={styles.barValue}>{formatValue(item.value, money)}</b>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ items, emptyText, palette }: { items?: BreakdownItem[]; emptyText?: string; palette?: string[] }) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return <EmptyChart text={emptyText} />;
  const colorSet = palette ?? PALETTE;
  const segments = items.reduce<{ label: string; value: number; start: number; end: number; color: string }[]>(
    (acc, item, i) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const end = start + (item.value / total) * 360;
      return [...acc, { ...item, start, end, color: colorSet[i % colorSet.length] }];
    },
    [],
  );
  const polar = (deg: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [50 + 38 * Math.cos(rad), 50 + 38 * Math.sin(rad)];
  };
  const active = segments.find((s) => s.label === activeSegment);
  return (
    <div className={styles.donut}>
      <svg className={styles.donutSvg} viewBox="0 0 100 100" role="img" aria-label="Gráfico circular">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#eef2ef" strokeWidth="16" />
        {segments.map((s) => {
          if (s.value <= 0) return null;
          if (s.end - s.start >= 359.9) {
            return (
              <circle key={s.label} cx="50" cy="50" r="38" fill="none" stroke={s.color} strokeWidth="16"
                style={{ cursor: "pointer", opacity: activeSegment && activeSegment !== s.label ? 0.45 : 1 }}
                onMouseEnter={() => setActiveSegment(s.label)}
                onMouseLeave={() => setActiveSegment(null)} />
            );
          }
          const [x1, y1] = polar(s.start);
          const [x2, y2] = polar(s.end);
          const large = s.end - s.start > 180 ? 1 : 0;
          return (
            <path key={s.label}
              d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A 38 38 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
              fill="none" stroke={s.color} strokeWidth={activeSegment === s.label ? 19 : 16}
              style={{ cursor: "pointer", opacity: activeSegment && activeSegment !== s.label ? 0.45 : 1, transition: "stroke-width 0.15s" }}
              onMouseEnter={() => setActiveSegment(s.label)}
              onMouseLeave={() => setActiveSegment(null)}
            />
          );
        })}
        {active ? (
          <>
            <text x="50" y="46" textAnchor="middle" fontSize="10" fontWeight="800" fill="#17201d">
              {Math.round((active.value / total) * 100)}%
            </text>
            <text x="50" y="57" textAnchor="middle" fontSize="6" fill="#68736e">
              {short(active.label, 14)}
            </text>
          </>
        ) : (
          <>
            <text x="50" y="48" textAnchor="middle" fontSize="13" fontWeight="800" fill="#17201d">
              {new Intl.NumberFormat("es-PE", { notation: "compact" }).format(total)}
            </text>
            <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#68736e">
              total
            </text>
          </>
        )}
      </svg>
      <ul className={styles.donutLegend}>
        {segments.map((s) => (
          <li key={s.label}
            style={{ cursor: "pointer", opacity: activeSegment && activeSegment !== s.label ? 0.5 : 1, transition: "opacity 0.15s" }}
            onMouseEnter={() => setActiveSegment(s.label)}
            onMouseLeave={() => setActiveSegment(null)}
            title={`${s.label}: ${new Intl.NumberFormat("es-PE").format(s.value)} (${Math.round((s.value / total) * 100)}%)`}
          >
            <i className={styles.donutDot} style={{ background: s.color }} />
            {short(s.label, 18)} <b className={styles.donutPct}>{Math.round((s.value / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendChart({
  items,
  money = false,
  emptyText,
  color = "#123f32",
}: {
  items?: BreakdownItem[];
  money?: boolean;
  emptyText?: string;
  color?: string;
}) {
  const [hovered, setHovered] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const max = maxValue(items);
  const w = 560;
  const h = 160;
  const pad = 8;
  const base = h - 24;
  const step = (w - pad * 2) / Math.max(1, items.length - 1);
  const points = items.map((item, i) => {
    const x = pad + i * step;
    const y = base - (item.value / max) * (h - 48);
    return { x, y, item };
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <div role="img" aria-label="Tendencia últimos 14 días" style={{ position: "relative" }}>
      {hovered && (
        <div className={styles.trendTooltip}>
          <strong>{hovered.label}</strong>: {formatValue(hovered.value, money)}
        </div>
      )}
      <svg className={styles.trendSvg} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={base - f * (h - 48)} y2={base - f * (h - 48)} stroke="#e6ebe8" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L ${(w - pad).toFixed(1)} ${base.toFixed(1)} L ${pad} ${base.toFixed(1)} Z`} fill={`${color}14`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p) => (
          <circle key={p.item.label} cx={p.x} cy={p.y} r="5" fill={color} style={{ cursor: "pointer", transition: "r 0.1s" }}
            onMouseEnter={(e) => { (e.currentTarget as SVGCircleElement).setAttribute("r", "7"); setHovered({ label: p.item.label, value: p.item.value, x: p.x, y: p.y }); }}
            onMouseLeave={(e) => { (e.currentTarget as SVGCircleElement).setAttribute("r", "5"); setHovered(null); }}
          >
            <title>{`${p.item.label}: ${formatValue(p.item.value, money)}`}</title>
          </circle>
        ))}
      </svg>
      <div className={styles.trendAxis}>
        <span>{items[0].label}</span>
        <span>{items[Math.floor(items.length / 2)].label}</span>
        <span>{items[items.length - 1].label}</span>
      </div>
    </div>
  );
}

export function ConvocatoriaMatrixTable({ rows }: { rows?: ConvocatoriaSummaryRow[] }) {
  if (!rows?.length) return <EmptyChart text="Sin datos de convocatorias registrados." />;

  const totalP = rows.reduce((s, r) => s + r.totalPostulantes, 0);
  const ingP = rows.reduce((s, r) => s + r.ingresantes, 0);
  const noIngP = rows.reduce((s, r) => s + r.noIngresantes, 0);
  const pctP = totalP > 0 ? (ingP / totalP) * 100 : 0;
  const avgP = rows.length > 0 ? rows.reduce((s, r) => s + r.puntajePromedio, 0) / rows.length : 0;
  const recP = rows.reduce((s, r) => s + r.recaudacionTotal, 0);

  const fmtNum = (v: number) => new Intl.NumberFormat("es-PE").format(v);
  const fmtMoney = (v: number) => new Intl.NumberFormat("es-PE").format(Math.round(v));
  const fmtPct = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;
  const fmtDec = (v: number) => v.toFixed(2).replace(".", ",");

  return (
    <div className={styles.matrixWrapper}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th>convocatoria</th>
            <th>Total Postulantes</th>
            <th>Ingresantes</th>
            <th>No Ingresantes</th>
            <th>% Ingreso</th>
            <th>Puntaje Promedio</th>
            <th>Recaudación Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.convocatoria}>
              <td>{row.convocatoria}</td>
              <td>{fmtNum(row.totalPostulantes)}</td>
              <td>{fmtNum(row.ingresantes)}</td>
              <td>{fmtNum(row.noIngresantes)}</td>
              <td>{fmtPct(row.porcentajeIngreso)}</td>
              <td>{fmtDec(row.puntajePromedio)}</td>
              <td>{fmtMoney(row.recaudacionTotal)}</td>
            </tr>
          ))}
          <tr className={styles.matrixTotalRow}>
            <td>Total</td>
            <td>{fmtNum(totalP)}</td>
            <td>{fmtNum(ingP)}</td>
            <td>{fmtNum(noIngP)}</td>
            <td>{fmtPct(pctP)}</td>
            <td>{fmtDec(avgP)}</td>
            <td>{fmtMoney(recP)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function StackedRangeChart({
  items,
}: {
  items?: { rango?: string; tipoColegio?: string; ingresantes: number; noIngresantes: number; enProceso: number }[];
}) {
  const [tooltip, setTooltip] = useState<{ label: string; ing: number; noIng: number; proc: number } | null>(null);
  if (!items?.length) return <EmptyChart text="Sin datos de distribución." />;
  const maxTotal = Math.max(1, ...items.map((i) => i.ingresantes + i.noIngresantes + i.enProceso));

  return (
    <div style={{ position: "relative" }}>
      {tooltip && (
        <div className={styles.stackedTooltip}>
          <strong>{tooltip.label}</strong>
          <span style={{ color: "#0070f3" }}>● Ingresantes: {tooltip.ing}</span>
          <span style={{ color: "#002060" }}>● No Ingresantes: {tooltip.noIng}</span>
          <span style={{ color: "#e66a54" }}>● En proceso: {tooltip.proc}</span>
        </div>
      )}
      <div className={styles.chartLegend}>
        <span><i className={styles.legendDot} style={{ background: "#e66a54" }} />En proceso</span>
        <span><i className={styles.legendDot} style={{ background: "#0070f3" }} />Ingresante</span>
        <span><i className={styles.legendDot} style={{ background: "#002060" }} />No Ingresante</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: "16px", height: "135px", alignItems: "end" }}>
        {items.map((item) => {
          const total = item.ingresantes + item.noIngresantes + item.enProceso;
          const lbl = item.rango ?? item.tipoColegio ?? "—";
          const hPct = Math.max(8, (total / maxTotal) * 100);
          const ingPct = total > 0 ? (item.ingresantes / total) * 100 : 0;
          const noIngPct = total > 0 ? (item.noIngresantes / total) * 100 : 0;
          const procPct = total > 0 ? (item.enProceso / total) * 100 : 0;

          return (
            <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "pointer" }}
              onMouseEnter={() => setTooltip({ label: lbl, ing: item.ingresantes, noIng: item.noIngresantes, proc: item.enProceso })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div style={{ width: "100%", height: `${hPct}%`, display: "flex", flexDirection: "column-reverse", borderRadius: "4px", overflow: "hidden", background: "#eef2ef", transition: "filter 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
              >
                {procPct > 0 && <div style={{ height: `${procPct}%`, background: "#e66a54" }} title={`En proceso: ${item.enProceso}`} />}
                {ingPct > 0 && <div style={{ height: `${ingPct}%`, background: "#0070f3" }} title={`Ingresantes: ${item.ingresantes}`} />}
                {noIngPct > 0 && <div style={{ height: `${noIngPct}%`, background: "#002060" }} title={`No Ingresantes: ${item.noIngresantes}`} />}
              </div>
              <span style={{ fontSize: "0.68rem", color: "#68736e", marginTop: "6px", textAlign: "center" }}>{lbl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GroupedBarChart({
  items,
}: {
  items?: { carrera: string; ingresante: number; noIngresante: number }[];
}) {
  const [tooltip, setTooltip] = useState<{ carrera: string; ing: number; noIng: number } | null>(null);
  if (!items?.length) return <EmptyChart text="Sin datos por carrera." />;

  return (
    <div style={{ position: "relative" }}>
      {tooltip && (
        <div className={styles.stackedTooltip}>
          <strong>{tooltip.carrera}</strong>
          <span style={{ color: "#0070f3" }}>● Ingresante: {tooltip.ing.toFixed(2)}</span>
          <span style={{ color: "#002060" }}>● No Ingresante: {tooltip.noIng.toFixed(2)}</span>
        </div>
      )}
      <div className={styles.chartLegend}>
        <span><i className={styles.legendDot} style={{ background: "#0070f3" }} />Ingresante</span>
        <span><i className={styles.legendDot} style={{ background: "#002060" }} />No Ingresante</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 8)}, 1fr)`, gap: "8px", height: "135px", alignItems: "end" }}>
        {items.slice(0, 8).map((item) => (
          <div key={item.carrera} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "pointer" }}
            onMouseEnter={() => setTooltip({ carrera: item.carrera, ing: item.ingresante, noIng: item.noIngresante })}
            onMouseLeave={() => setTooltip(null)}
          >
            <div style={{ display: "flex", alignItems: "end", gap: "2px", width: "100%", height: "100%" }}>
              <div style={{ flex: 1, height: `${Math.max(4, (item.ingresante / 20) * 100)}%`, background: "#0070f3", borderRadius: "2px 2px 0 0", transition: "filter 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
                title={`Puntaje Ingresante: ${item.ingresante.toFixed(2)}`} />
              <div style={{ flex: 1, height: `${Math.max(4, (item.noIngresante / 20) * 100)}%`, background: "#002060", borderRadius: "2px 2px 0 0", transition: "filter 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
                title={`Puntaje No Ingresante: ${item.noIngresante.toFixed(2)}`} />
            </div>
            <span style={{ fontSize: "0.6rem", color: "#68736e", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>
              {item.carrera.slice(0, 7)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScatterPlotChart({
  items,
}: {
  items?: { carrera: string; facultad: string; totalPostulantes: number; puntajePromedio: number }[];
}) {
  const [hovered, setHovered] = useState<{ carrera: string; facultad: string; totalPostulantes: number; puntajePromedio: number; cx: number; cy: number } | null>(null);
  if (!items?.length) return <EmptyChart text="Sin datos de demanda." />;

  const allX = items.map((i) => i.totalPostulantes);
  const allY = items.map((i) => i.puntajePromedio);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const dots = items.map((item) => {
    const cx = Math.max(12, Math.min(88, ((item.totalPostulantes - minX) / rangeX) * 76 + 12));
    const cy = Math.max(12, Math.min(88, 88 - ((item.puntajePromedio - minY) / rangeY) * 76));
    return { ...item, cx, cy };
  });

  return (
    <div style={{ position: "relative" }}>
      {hovered && (
        <div className={styles.stackedTooltip}>
          <strong>{hovered.facultad}</strong>
          <span>Postulantes: {hovered.totalPostulantes}</span>
          <span>Puntaje prom.: {hovered.puntajePromedio.toFixed(2)}</span>
        </div>
      )}
      <svg className={styles.academicSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="10" y1="90" x2="90" y2="90" stroke="#dbe2de" strokeWidth="1" />
        <line x1="10" y1="10" x2="10" y2="90" stroke="#dbe2de" strokeWidth="1" />
        {dots.map((d, i) => (
          <circle key={d.carrera} cx={d.cx} cy={d.cy} r={hovered?.carrera === d.carrera ? 5.5 : 3.5}
            fill={PALETTE[i % PALETTE.length]}
            style={{ cursor: "pointer", transition: "r 0.1s" }}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
          >
            <title>{`${d.facultad}: ${d.totalPostulantes} postulantes, Promed. ${d.puntajePromedio}`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "#8a9490", marginTop: "2px" }}>
        <span>{minX} postulantes</span>
        <span>Demanda vs Puntaje Promedio</span>
        <span>{maxX} postulantes</span>
      </div>
    </div>
  );
}

export function AcademicFacultyTable({
  rows,
}: {
  rows?: { facultad: string; totalPostulantes: number; ingresantes: number; porcentajeIngreso: number; puntajePromedio: number }[];
}) {
  if (!rows?.length) return <EmptyChart text="Sin datos de facultades." />;

  const totalP = rows.reduce((s, r) => s + r.totalPostulantes, 0);
  const ingP = rows.reduce((s, r) => s + r.ingresantes, 0);
  const pctP = totalP > 0 ? (ingP / totalP) * 100 : 0;
  const avgP = rows.length > 0 ? rows.reduce((s, r) => s + r.puntajePromedio, 0) / rows.length : 0;

  const fmtNum = (v: number) => new Intl.NumberFormat("es-PE").format(v);
  const fmtPct = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;
  const fmtDec = (v: number) => v.toFixed(2).replace(".", ",");

  return (
    <div className={styles.matrixWrapper}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th>facultad</th>
            <th>Total Postulantes</th>
            <th>Ingresantes</th>
            <th>% Ingreso</th>
            <th>Puntaje Promedio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.facultad}>
              <td>{row.facultad}</td>
              <td>{fmtNum(row.totalPostulantes)}</td>
              <td>{fmtNum(row.ingresantes)}</td>
              <td>{fmtPct(row.porcentajeIngreso)}</td>
              <td>{fmtDec(row.puntajePromedio)}</td>
            </tr>
          ))}
          <tr className={styles.matrixTotalRow}>
            <td>Total</td>
            <td>{fmtNum(totalP)}</td>
            <td>{fmtNum(ingP)}</td>
            <td>{fmtPct(pctP)}</td>
            <td>{fmtDec(avgP)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── ECONOMIC CHARTS ───────────────────────────────────────────────────

export interface EconomicData {
  recaudacionPorConvocatoria?: BreakdownItem[];
  recaudacionPorMetodo?: BreakdownItem[];
  pagosPorDia?: BreakdownItem[];
  recaudacionPorTipoColegio?: BreakdownItem[];
  totalRecaudacion?: number;
  totalPagos?: number;
  promedioPorPostulante?: number;
}

export function EconomicKpiCards({ data }: { data?: EconomicData }) {
  const ECO_KPI_PALETTE = ["#0e4d7a", "#1565a7", "#2184d0"];
  const kpis = [
    {
      label: "Recaudación Total",
      value: `S/ ${new Intl.NumberFormat("es-PE").format(Math.round(data?.totalRecaudacion ?? 0))}`,
      hint: "Total consolidado",
      color: ECO_KPI_PALETTE[0],
    },
    {
      label: "Total Pagos Confirmados",
      value: new Intl.NumberFormat("es-PE").format(data?.totalPagos ?? 0),
      hint: "Pagos procesados",
      color: ECO_KPI_PALETTE[1],
    },
    {
      label: "Promedio por Postulante",
      value: `S/ ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data?.promedioPorPostulante ?? 230)}`,
      hint: "Costo promedio inscripción",
      color: ECO_KPI_PALETTE[2],
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
      {kpis.map((k) => (
        <article key={k.label} style={{ padding: "18px 20px", border: "1px solid var(--line)", borderRadius: "6px", background: "white" }}>
          <span style={{ display: "block", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>{k.label}</span>
          <strong style={{ display: "block", fontSize: "1.45rem", fontWeight: 800, margin: "10px 0 4px", color: k.color, lineHeight: 1 }}>{k.value}</strong>
          <small style={{ fontSize: "0.7rem", color: "#8a9490" }}>{k.hint}</small>
        </article>
      ))}
    </div>
  );
}

const ECO_COLORS = ["#0e4d7a", "#1565a7", "#2184d0", "#5eaee8", "#99ccf5", "#c8e3f9", "#1a7a5e", "#27ae88"];

export function EconomicBarsChart({
  items,
  emptyText,
}: {
  items?: BreakdownItem[];
  emptyText?: string;
}) {
  const [tooltip, setTooltip] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const max = maxValue(items);
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico económico de barras" style={{ position: "relative" }}>
      {tooltip && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong>
          <span>S/ {new Intl.NumberFormat("es-PE").format(Math.round(tooltip.value))}</span>
        </div>
      )}
      {items.map((item, i) => (
        <div key={item.label} className={styles.barRow} style={{ gridTemplateColumns: "140px 1fr auto" }}>
          <span className={styles.barLabel} title={item.label}>{short(item.label, 22)}</span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.interactiveBar}`}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: ECO_COLORS[i % ECO_COLORS.length] }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('[role="img"]') as HTMLElement)?.getBoundingClientRect();
                const el = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: item.label, value: item.value, x: el.right - (rect?.left ?? 0) + 6, y: el.top - (rect?.top ?? 0) - 4 });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </div>
          <b className={styles.barValue}>S/ {new Intl.NumberFormat("es-PE").format(Math.round(item.value))}</b>
        </div>
      ))}
    </div>
  );
}
