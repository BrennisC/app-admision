"use client";

import { DataTable, ScreenLayout } from "../../shared/ui";
import type { Row } from "../../shared/types";

export function AuditSection({ rows }: { rows: Row[] }) {
  return (
    <ScreenLayout title="Auditoría" description="Trazabilidad de mutaciones y movimientos críticos." aside="La bitácora es de solo lectura para los usuarios funcionales.">
      <DataTable rows={rows} columns={["fecha", "usuario", "accion", "modulo", "registro", "detalle"]} />
    </ScreenLayout>
  );
}
