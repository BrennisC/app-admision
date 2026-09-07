export type CellScalar = string | number | boolean | null;
export type DataRow = Record<string, CellScalar>;
export type WorkbookData = Record<string, DataRow[]>;

export const SHEET_HEADERS: Record<string, string[]> = {
  postulantes: [
    "id_postulante", "dni", "nombres", "apellidos", "tipo_colegio", "telefono",
    "correo", "direccion", "fecha_nacimiento", "estado", "convocatoria", "facultad",
    "carrera", "costo", "voucher", "fecha", "puntaje",
  ],
  convocatorias: ["id_convocatoria", "nombre", "fecha_inicio", "fecha_fin", "fecha_examen", "estado"],
  facultades: ["id_facultad", "nombre", "estado"],
  carreras: ["id_carrera", "codigo", "id_facultad", "facultad", "nombre", "estado"],
  conceptos_pago: ["id_concepto", "codigo", "descripcion", "monto", "estado"],
  inscripciones: ["id_inscripcion", "id_postulante", "id_convocatoria", "id_carrera", "modalidad", "fecha_inscripcion", "estado"],
  ordenes_pago: ["id_orden", "codigo", "id_inscripcion", "id_concepto", "monto", "fecha_emision", "fecha_vencimiento", "estado"],
  pagos: ["id_pago", "codigo_pago", "id_orden", "monto", "metodo_pago", "voucher", "fecha_pago", "usuario", "estado"],
  cajas: ["id_caja", "usuario", "fecha_apertura", "saldo_inicial", "fecha_cierre", "saldo_final", "estado"],
  movimientos_caja: ["id_movimiento", "id_caja", "tipo", "concepto", "monto", "fecha", "referencia"],
  resultados: ["id_resultado", "id_inscripcion", "puntaje", "puesto", "condicion"],
  usuarios: ["id_usuario", "username", "password", "nombre", "rol", "estado"],
  auditoria: ["id_auditoria", "usuario", "accion", "modulo", "registro", "fecha", "detalle"],
};

export function nextId(rows: DataRow[], key: string): number {
  return rows.reduce((maximum, row) => Math.max(maximum, Number(row[key]) || 0), 0) + 1;
}
