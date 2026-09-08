"use client";

import { useState } from "react";
import { DataTable, Field, ScreenLayout } from "../../shared/ui";
import { text } from "../../shared/api";
import type { Row } from "../../shared/types";
import styles from "./OrdersSection.module.css";

export function OrdersSection({ orders }: { orders: Row[] }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const filtered = orders.filter((row) => {
    if (estado && row.estado !== estado) return false;
    if (!q) return true;
    return `${text(row.codigo)} ${text(row.id_inscripcion)}`
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  return (
    <ScreenLayout
      title="Órdenes de pago"
      description="Deudas generadas desde inscripciones válidas. La anulación controlada llega con el backend (POST /ordenes-pago/:id/anulacion)."
      aside={`${orders.filter((row) => row.estado === "PENDIENTE").length} órdenes pendientes de cobro.`}
    >
      <div className={styles.lookup}>
        <Field label="Buscar por código o inscripción">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="OP-2026-…"
          />
        </Field>
        <Field label="Estado">
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </Field>
      </div>
      <DataTable
        rows={filtered}
        columns={[
          "codigo",
          "id_inscripcion",
          "monto",
          "fecha_vencimiento",
          "estado",
        ]}
      />
    </ScreenLayout>
  );
}
