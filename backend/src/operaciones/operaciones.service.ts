import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditoriaService } from "../auditoria/auditoria.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { nextId, type DataRow, type WorkbookData } from "../infrastructure/excel/excel-database.types";
import type {
  AbrirCajaDto,
  CerrarCajaDto,
  CrearCarreraDto,
  CrearConceptoPagoDto,
  CrearConvocatoriaDto,
  CrearInscripcionDto,
  RegistrarPagoDto,
  RegistrarResultadoDto,
} from "./operaciones.dto";

@Injectable()
export class OperacionesService {
  constructor(private readonly database: ExcelDatabaseService, private readonly auditoria: AuditoriaService) {}

  catalogos() {
    return this.database.read((data) => ({
      convocatorias: data.convocatorias,
      facultades: data.facultades,
      carreras: data.carreras,
      conceptosPago: data.conceptos_pago,
    }));
  }

  crearConvocatoria(input: CrearConvocatoriaDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      if (data.convocatorias.some((row) => same(row.nombre, input.nombre))) throw new ConflictException("La convocatoria ya existe");
      const id = nextId(data.convocatorias, "id_convocatoria");
      const row = { id_convocatoria: id, nombre: input.nombre, fecha_inicio: input.fechaInicio, fecha_fin: input.fechaFin, fecha_examen: input.fechaExamen, estado: "ACTIVO" };
      data.convocatorias.push(row);
      this.audit(data, user, "CREAR", "CONVOCATORIAS", id, input.nombre);
      return row;
    });
  }

  crearCarrera(input: CrearCarreraDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const faculty = find(data.facultades, "id_facultad", input.idFacultad, "facultad");
      if (data.carreras.some((row) => same(row.codigo, input.codigo) || same(row.nombre, input.nombre))) throw new ConflictException("La carrera ya existe");
      const id = nextId(data.carreras, "id_carrera");
      const row = { id_carrera: id, codigo: input.codigo.toUpperCase(), id_facultad: input.idFacultad, facultad: faculty.nombre, nombre: input.nombre, estado: "ACTIVO" };
      data.carreras.push(row);
      this.audit(data, user, "CREAR", "CARRERAS", id, input.nombre);
      return row;
    });
  }

  crearConcepto(input: CrearConceptoPagoDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      if (data.conceptos_pago.some((row) => same(row.codigo, input.codigo))) throw new ConflictException("El concepto ya existe");
      const id = nextId(data.conceptos_pago, "id_concepto");
      const row = { id_concepto: id, codigo: input.codigo.toUpperCase(), descripcion: input.descripcion, monto: input.monto, estado: "ACTIVO" };
      data.conceptos_pago.push(row);
      this.audit(data, user, "CREAR", "CONCEPTOS_PAGO", id, `${input.codigo} S/ ${input.monto}`);
      return row;
    });
  }

  inscripciones() {
    return this.database.read((data) => [...data.inscripciones].reverse());
  }

  crearInscripcion(input: CrearInscripcionDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      find(data.postulantes, "id_postulante", input.idPostulante, "postulante");
      const convocatoria = find(data.convocatorias, "id_convocatoria", input.idConvocatoria, "convocatoria");
      find(data.carreras, "id_carrera", input.idCarrera, "carrera");
      if (data.inscripciones.some((row) => Number(row.id_postulante) === input.idPostulante && Number(row.id_convocatoria) === input.idConvocatoria && row.estado !== "ANULADO")) {
        throw new ConflictException("El postulante ya tiene una inscripcion activa en esta convocatoria");
      }
      const concept = input.idConcepto
        ? find(data.conceptos_pago, "id_concepto", input.idConcepto, "concepto de pago")
        : data.conceptos_pago.find((row) => row.estado === "ACTIVO");
      if (!concept) throw new BadRequestException("No existe un concepto de pago activo");
      const now = new Date();
      const id = nextId(data.inscripciones, "id_inscripcion");
      const inscription = { id_inscripcion: id, id_postulante: input.idPostulante, id_convocatoria: input.idConvocatoria, id_carrera: input.idCarrera, modalidad: input.modalidad, fecha_inscripcion: now.toISOString(), estado: "PENDIENTE_PAGO" };
      data.inscripciones.push(inscription);
      const orderId = nextId(data.ordenes_pago, "id_orden");
      const dueDate = new Date(now); dueDate.setDate(dueDate.getDate() + 5);
      const year = String(convocatoria.nombre).match(/\d{4}/)?.[0] ?? String(now.getFullYear());
      const order = { id_orden: orderId, codigo: `OP-${year}-${String(orderId).padStart(6, "0")}`, id_inscripcion: id, id_concepto: Number(concept.id_concepto), monto: Number(concept.monto), fecha_emision: now.toISOString(), fecha_vencimiento: dueDate.toISOString(), estado: "PENDIENTE" };
      data.ordenes_pago.push(order);
      this.audit(data, user, "CREAR", "INSCRIPCIONES", id, `Orden ${order.codigo}`);
      return { inscripcion: inscription, orden: order };
    });
  }

  confirmarInscripcion(id: number, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const row = find(data.inscripciones, "id_inscripcion", id, "inscripcion");
      if (row.estado !== "PAGADO") throw new BadRequestException("Solo se puede confirmar una inscripcion pagada");
      row.estado = "CONFIRMADO";
      this.audit(data, user, "CONFIRMAR", "INSCRIPCIONES", id, "Inscripcion confirmada");
      return row;
    });
  }

  ordenes() {
    return this.database.read((data) => [...data.ordenes_pago].reverse());
  }

  abrirCaja(input: AbrirCajaDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      if (data.cajas.some((row) => row.usuario === user.username && row.estado === "ABIERTA")) throw new ConflictException("El usuario ya tiene una caja abierta");
      const id = nextId(data.cajas, "id_caja");
      const row = { id_caja: id, usuario: user.username, fecha_apertura: new Date().toISOString(), saldo_inicial: input.saldoInicial, fecha_cierre: "", saldo_final: "", estado: "ABIERTA" };
      data.cajas.push(row);
      this.audit(data, user, "ABRIR", "CAJA", id, `Saldo inicial S/ ${input.saldoInicial}`);
      return row;
    });
  }

  cerrarCaja(id: number, input: CerrarCajaDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const cash = find(data.cajas, "id_caja", id, "caja");
      if (cash.estado !== "ABIERTA") throw new BadRequestException("La caja ya esta cerrada");
      if (cash.usuario !== user.username && user.role !== "ADMIN") throw new BadRequestException("La caja pertenece a otro usuario");
      const income = data.movimientos_caja.filter((row) => Number(row.id_caja) === id && row.tipo === "INGRESO").reduce((sum, row) => sum + Number(row.monto), 0);
      const expected = round(Number(cash.saldo_inicial) + income);
      cash.fecha_cierre = new Date().toISOString(); cash.saldo_final = input.saldoFinal; cash.estado = "CERRADA";
      this.audit(data, user, "CERRAR", "CAJA", id, `Esperado S/ ${expected}; declarado S/ ${input.saldoFinal}`);
      return { ...cash, saldo_esperado: expected, diferencia: round(input.saldoFinal - expected) };
    });
  }

  cajas() {
    return this.database.read((data) => [...data.cajas].reverse());
  }

  pagos() {
    return this.database.read((data) => [...data.pagos].reverse());
  }

  comprobante(id: number) {
    return this.database.read((data) => {
      const payment = find(data.pagos, "id_pago", id, "pago");
      const order = find(data.ordenes_pago, "id_orden", Number(payment.id_orden), "orden de pago");
      const inscription = find(data.inscripciones, "id_inscripcion", Number(order.id_inscripcion), "inscripcion");
      const applicant = find(data.postulantes, "id_postulante", Number(inscription.id_postulante), "postulante");
      return {
        numero: payment.codigo_pago,
        fecha: payment.fecha_pago,
        postulante: `${applicant.nombres} ${applicant.apellidos}`,
        dni: applicant.dni,
        orden: order.codigo,
        concepto: data.conceptos_pago.find((row) => Number(row.id_concepto) === Number(order.id_concepto))?.descripcion ?? "Derecho de inscripcion",
        monto: payment.monto,
        metodoPago: payment.metodo_pago,
        voucher: payment.voucher,
        cajero: payment.usuario,
      };
    });
  }

  registrarPago(input: RegistrarPagoDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const order = find(data.ordenes_pago, "id_orden", input.idOrden, "orden de pago");
      if (order.estado !== "PENDIENTE") throw new BadRequestException("La orden no esta pendiente");
      if (round(Number(order.monto)) !== round(input.monto)) throw new BadRequestException("El monto no coincide con la orden");
      if (input.metodoPago !== "EFECTIVO" && !input.voucher?.trim()) throw new BadRequestException("El voucher es obligatorio para pagos no efectivos");
      const cash = data.cajas.find((row) => row.usuario === user.username && row.estado === "ABIERTA");
      if (!cash) throw new BadRequestException("Debe abrir una caja antes de registrar pagos");
      const id = nextId(data.pagos, "id_pago");
      const payment = { id_pago: id, codigo_pago: `PAGO-${String(id).padStart(6, "0")}`, id_orden: input.idOrden, monto: input.monto, metodo_pago: input.metodoPago, voucher: input.voucher ?? "", fecha_pago: new Date().toISOString(), usuario: user.username, estado: "CONFIRMADO" };
      data.pagos.push(payment);
      order.estado = "PAGADA";
      const inscription = find(data.inscripciones, "id_inscripcion", Number(order.id_inscripcion), "inscripcion");
      inscription.estado = "PAGADO";
      data.movimientos_caja.push({ id_movimiento: nextId(data.movimientos_caja, "id_movimiento"), id_caja: Number(cash.id_caja), tipo: "INGRESO", concepto: `Pago ${payment.codigo_pago}`, monto: input.monto, fecha: payment.fecha_pago, referencia: String(order.codigo) });
      this.audit(data, user, "REGISTRAR_PAGO", "TESORERIA", id, `${payment.codigo_pago} S/ ${input.monto}`);
      return payment;
    });
  }

  resultados() {
    return this.database.read((data) => [...data.resultados].reverse());
  }

  registrarResultado(input: RegistrarResultadoDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const inscription = find(data.inscripciones, "id_inscripcion", input.idInscripcion, "inscripcion");
      if (inscription.estado !== "CONFIRMADO") throw new BadRequestException("La inscripcion debe estar confirmada");
      if (data.resultados.some((row) => Number(row.id_inscripcion) === input.idInscripcion)) throw new ConflictException("La inscripcion ya tiene resultado");
      const id = nextId(data.resultados, "id_resultado");
      const result = { id_resultado: id, id_inscripcion: input.idInscripcion, puntaje: input.puntaje, puesto: input.puesto, condicion: input.condicion };
      data.resultados.push(result);
      this.audit(data, user, "REGISTRAR", "RESULTADOS", id, `${input.condicion} - ${input.puntaje}`);
      return result;
    });
  }

  dashboard(filters: { anio?: string; facultad?: string; tipoColegio?: string } = {}) {
    return this.database.read((data) => {
      const confirmados = data.pagos.filter((row) => row.estado === "CONFIRMADO");
      const byYearBase = data.postulantes.filter(
        (row) => matchText(row.facultad, filters.facultad) && matchText(row.tipo_colegio, filters.tipoColegio),
      );
      const postulantes = byYearBase.filter((row) => matchYear(row, filters.anio));
      const scored = postulantes.filter((row) => isScored(row.puntaje));
      return {
        postulantes: postulantes.length,
        inscripciones: data.inscripciones.length,
        ordenesPendientes: data.ordenes_pago.filter((row) => row.estado === "PENDIENTE").length,
        pagos: confirmados.length,
        recaudacion: round(confirmados.reduce((sum, row) => sum + Number(row.monto), 0)),
        ingresantes: data.resultados.filter((row) => row.condicion === "INGRESANTE").length,
        porFacultad: top(countBy(postulantes, (row) => label(row.facultad)), 8),
        porTipoColegio: countBy(postulantes, (row) => label(row.tipo_colegio)),
        porEstadoInscripcion: countBy(data.inscripciones, (row) => label(row.estado, "SIN ESTADO")),
        recaudacionPorMetodo: sumBy(confirmados, (row) => label(row.metodo_pago, "SIN MÉTODO"), (row) => Number(row.monto)),
        pagosPorDia: lastDays(confirmados, 14),
        resultadosPorCondicion: countBy(data.resultados, (row) => label(row.condicion, "SIN CONDICIÓN")),
        porAnio: countByYear(byYearBase),
        distribucionPuntajes: scoreBuckets(scored),
        conPuntaje: scored.length,
        sinPuntaje: postulantes.length - scored.length,
        filtros: {
          anios: distinctYears(data.postulantes),
          facultades: distinctLabels(data.postulantes, (row) => String(row.facultad ?? "").trim()),
          tiposColegio: distinctLabels(data.postulantes, (row) => String(row.tipo_colegio ?? "").trim()),
        },
      };
    });
  }

  private audit(data: WorkbookData, user: AuthenticatedUser, accion: string, modulo: string, id: number, detalle: string): void {
    this.auditoria.append(data, { usuario: user.username, accion, modulo, registro: String(id), detalle });
  }
}

function find(rows: DataRow[], key: string, value: number, label: string): DataRow {
  const row = rows.find((candidate) => Number(candidate[key]) === value);
  if (!row) throw new NotFoundException(`No existe ${label} ${value}`);
  return row;
}

function same(value: unknown, expected: string): boolean {
  return String(value).trim().toLowerCase() === expected.trim().toLowerCase();
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface BreakdownItem {
  label: string;
  value: number;
}

function label(value: unknown, fallback = "SIN DATO"): string {
  const text = String(value ?? "").trim();
  return text ? text.toUpperCase().slice(0, 60) : fallback;
}

function countBy(rows: DataRow[], key: (row: DataRow) => string): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = key(row);
    totals.set(name, (totals.get(name) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([itemLabel, value]) => ({ label: itemLabel, value }))
    .sort((a, b) => b.value - a.value);
}

function sumBy(rows: DataRow[], key: (row: DataRow) => string, amount: (row: DataRow) => number): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = key(row);
    const current = Number(amount(row));
    if (!Number.isFinite(current)) continue;
    totals.set(name, round((totals.get(name) ?? 0) + current));
  }
  return [...totals.entries()]
    .map(([itemLabel, value]) => ({ label: itemLabel, value: round(value) }))
    .sort((a, b) => b.value - a.value);
}

function top(items: BreakdownItem[], limit: number): BreakdownItem[] {
  return items.slice(0, limit);
}

function extractYear(row: DataRow): string {
  const fromConvocatoria = String(row.convocatoria ?? "").match(/(\d{4})/)?.[1];
  if (fromConvocatoria) return fromConvocatoria;
  const date = new Date(String(row.fecha ?? ""));
  const year = date.getFullYear();
  return Number.isFinite(year) ? String(year) : "SIN AÑO";
}

function matchText(value: unknown, expected?: string): boolean {
  if (!expected?.trim()) return true;
  return String(value ?? "").trim().toLowerCase() === expected.trim().toLowerCase();
}

function matchYear(row: DataRow, expected?: string): boolean {
  if (!expected?.trim()) return true;
  return extractYear(row) === expected.trim();
}

function countByYear(rows: DataRow[]): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const year = extractYear(row);
    totals.set(year, (totals.get(year) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([itemLabel, value]) => ({ label: itemLabel, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function distinctYears(rows: DataRow[]): string[] {
  return [...new Set(rows.map(extractYear).filter((year) => year !== "SIN AÑO"))].sort();
}

function distinctLabels(rows: DataRow[], pick: (row: DataRow) => string): string[] {
  return [...new Set(rows.map(pick).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function isScored(value: unknown): boolean {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

function scoreBuckets(rows: DataRow[]): BreakdownItem[] {
  const buckets: BreakdownItem[] = [
    { label: "0 – 10", value: 0 },
    { label: "11 – 13", value: 0 },
    { label: "14 – 16", value: 0 },
    { label: "17 – 20", value: 0 },
  ];
  for (const row of rows) {
    const score = Number(row.puntaje);
    if (!Number.isFinite(score)) continue;
    if (score <= 10) buckets[0].value += 1;
    else if (score <= 13) buckets[1].value += 1;
    else if (score <= 16) buckets[2].value += 1;
    else buckets[3].value += 1;
  }
  return buckets;
}

function lastDays(rows: DataRow[], days: number): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    totals.set(date.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const raw = String(row.fecha_pago ?? row.fecha ?? "");
    if (!raw) continue;
    const day = new Date(raw).toISOString().slice(0, 10);
    if (totals.has(day)) totals.set(day, round((totals.get(day) ?? 0) + Number(row.monto)));
  }
  return [...totals.entries()].map(([itemLabel, value]) => ({ label: itemLabel.slice(5), value }));
}
