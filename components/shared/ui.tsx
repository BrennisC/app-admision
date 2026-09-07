"use client";

import type { ReactNode } from "react";
import styles from "./ui.module.css";
import { formatCell } from "./api";
import type { Row } from "./types";

export function ScreenLayout({ title, description, aside, children }: { title: string; description: string; aside: string; children: ReactNode }) {
  return (
    <div>
      <div className={styles.heading}>
        <div><h3>{title}</h3><p>{description}</p></div>
        <aside>{aside}</aside>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`${styles.field} ${wide ? styles.wide : ""}`}><span>{label}</span>{children}</label>;
}

export function FormActions({ label, disabled }: { label: string; disabled?: boolean }) {
  return <div className={styles.actions}><button type="submit" className="primary-button" disabled={disabled}>{label}</button></div>;
}

export function DataTable({ rows, columns, action }: {
  rows: Row[];
  columns: string[];
  action?: (row: Row) => { label: string; onClick: () => void } | undefined;
}) {
  if (!rows.length) return <div className={styles.empty}>Todavía no hay registros.</div>;
  return (
    <div className={styles.miniTable}>
      <table>
        <thead><tr>{columns.map((c) => <th key={c}>{c.replaceAll("_", " ")}</th>)}{action && <th>Acción</th>}</tr></thead>
        <tbody>
          {rows.slice(0, 15).map((row, i) => {
            const act = action?.(row);
            return (
              <tr key={String(row[columns[0]]) || i}>
                {columns.map((c) => <td key={c}>{formatCell(row[c], c)}</td>)}
                {action && <td>{act ? <button type="button" className="secondary-button" onClick={act.onClick}>{act.label}</button> : <span>—</span>}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase("es");
  const tone = normalized === "ingresante" ? styles.success : normalized.includes("no") ? styles.neutral : styles.warning;
  return <span className={`${styles.badge} ${tone}`}>{status || "Sin estado"}</span>;
}

export function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

export function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 5.5V19",
    wallet: "M3 6h18v14H3zM3 9h18M16 14h2",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}
