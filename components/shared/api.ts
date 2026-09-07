export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function number(value: unknown): number {
  return Number(value) || 0;
}

export function formatCell(value: unknown, column: string): string {
  const raw = text(value);
  if (column.includes("fecha") && raw) return new Date(raw).toLocaleDateString("es-PE");
  if (column === "monto") return `S/ ${Number(value).toFixed(2)}`;
  return raw || "—";
}

export function formObject(form: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field, text(form.get(field))]));
}

export function initials(names: string, surnames: string): string {
  return `${names.trim()[0] ?? ""}${surnames.trim()[0] ?? ""}`.toUpperCase();
}

export function formatNumber(value?: number): string {
  return value === undefined ? "—" : new Intl.NumberFormat("es-PE").format(value);
}

export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function printReceipt(id: number, api: <T>(path: string, init?: RequestInit) => Promise<T>): Promise<void> {
  const receipt = await api<Record<string, string | number | null>>(`/pagos/${id}/comprobante`);
  const popup = window.open("", "comprobante", "width=720,height=780");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${text(receipt.numero)}</title><style>body{font:14px Arial;padding:48px;color:#17201d}header{border-bottom:3px solid #123f32;padding-bottom:18px}h1{font:28px Georgia;margin:5px 0}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.total{font-size:22px;font-weight:bold}.note{margin-top:35px;color:#68736e}@media print{button{display:none}}</style></head><body><header><small>Universidad Nacional Agraria de la Selva</small><h1>Comprobante de pago</h1><strong>${text(receipt.numero)}</strong></header><div class="row"><span>Postulante</span><b>${text(receipt.postulante)}</b></div><div class="row"><span>DNI</span><b>${text(receipt.dni)}</b></div><div class="row"><span>Orden</span><b>${text(receipt.orden)}</b></div><div class="row"><span>Concepto</span><b>${text(receipt.concepto)}</b></div><div class="row"><span>Método</span><b>${text(receipt.metodoPago)}</b></div><div class="row total"><span>Total</span><b>S/ ${Number(receipt.monto).toFixed(2)}</b></div><p class="note">Emitido el ${new Date(text(receipt.fecha)).toLocaleString("es-PE")} por ${text(receipt.cajero)}.</p><button onclick="window.print()">Imprimir o guardar como PDF</button></body></html>`);
  popup.document.close();
}
