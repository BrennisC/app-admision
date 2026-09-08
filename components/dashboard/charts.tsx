"use client";

import styles from "./charts.module.css";
import type { BreakdownItem } from "../shared/types";

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

export function BarsChart({
  items,
  money = false,
  emptyText,
}: {
  items?: BreakdownItem[];
  money?: boolean;
  emptyText?: string;
}) {
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const max = maxValue(items);
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras">
      {items.map((item, i) => (
        <div key={item.label} className={styles.barRow}>
          <span className={styles.barLabel} title={item.label}>
            {short(item.label)}
          </span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </div>
          <b className={styles.barValue}>{formatValue(item.value, money)}</b>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ items, emptyText }: { items?: BreakdownItem[]; emptyText?: string }) {
  if (!items?.length) return <EmptyChart text={emptyText} />;
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return <EmptyChart text={emptyText} />;
  const segments = items.reduce<{ label: string; value: number; start: number; end: number; color: string }[]>(
    (acc, item, i) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const end = start + (item.value / total) * 360;
      return [...acc, { ...item, start, end, color: PALETTE[i % PALETTE.length] }];
    },
    [],
  );
  const polar = (deg: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [50 + 38 * Math.cos(rad), 50 + 38 * Math.sin(rad)];
  };
  return (
    <div className={styles.donut}>
      <svg className={styles.donutSvg} viewBox="0 0 100 100" role="img" aria-label="Gráfico circular">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#eef2ef" strokeWidth="16" />
        {segments.map((s) => {
          if (s.value <= 0) return null;
          if (s.end - s.start >= 359.9) {
            return <circle key={s.label} cx="50" cy="50" r="38" fill="none" stroke={s.color} strokeWidth="16" />;
          }
          const [x1, y1] = polar(s.start);
          const [x2, y2] = polar(s.end);
          const large = s.end - s.start > 180 ? 1 : 0;
          return <path key={s.label} d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A 38 38 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`} fill="none" stroke={s.color} strokeWidth="16" />;
        })}
        <text x="50" y="48" textAnchor="middle" fontSize="13" fontWeight="800" fill="#17201d">
          {new Intl.NumberFormat("es-PE", { notation: "compact" }).format(total)}
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#68736e">
          total
        </text>
      </svg>
      <ul className={styles.donutLegend}>
        {segments.map((s) => (
          <li key={s.label} title={`${s.label}: ${s.value}`}>
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
}: {
  items?: BreakdownItem[];
  money?: boolean;
  emptyText?: string;
}) {
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
    <div role="img" aria-label="Tendencia últimos 14 días">
      <svg className={styles.trendSvg} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={base - f * (h - 48)} y2={base - f * (h - 48)} stroke="#e6ebe8" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L ${(w - pad).toFixed(1)} ${base.toFixed(1)} L ${pad} ${base.toFixed(1)} Z`} fill="#123f3214" />
        <path d={line} fill="none" stroke="#123f32" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p) => (
          <circle key={p.item.label} cx={p.x} cy={p.y} r="3.5" fill="#123f32">
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
