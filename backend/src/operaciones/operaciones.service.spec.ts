import { AuditoriaService } from "../auditoria/auditoria.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { SHEET_HEADERS, type WorkbookData } from "../infrastructure/excel/excel-database.types";
import { OperacionesService } from "./operaciones.service";

class MemoryDatabase {
  constructor(readonly data: WorkbookData) {}
  read<T>(reader: (data: WorkbookData) => T): Promise<T> { return Promise.resolve(reader(this.data)); }
  async transaction<T>(mutation: (data: WorkbookData) => T | Promise<T>): Promise<T> { return mutation(this.data); }
}

const user: AuthenticatedUser = { sub: 1, username: "admin", name: "Administrador", role: "ADMIN" };

describe("OperacionesService", () => {
  let data: WorkbookData;
  let service: OperacionesService;

  beforeEach(() => {
    data = Object.fromEntries(Object.keys(SHEET_HEADERS).map((sheet) => [sheet, []]));
    data.postulantes.push({ id_postulante: 1, dni: "73698379", nombres: "Victor", apellidos: "Rojas" });
    data.convocatorias.push({ id_convocatoria: 1, nombre: "2026-I", estado: "ACTIVO" });
    data.facultades.push({ id_facultad: 1, nombre: "Ingenieria", estado: "ACTIVO" });
    data.carreras.push({ id_carrera: 1, id_facultad: 1, nombre: "Sistemas", codigo: "SIS", estado: "ACTIVO" });
    data.conceptos_pago.push({ id_concepto: 1, codigo: "ADM001", descripcion: "Inscripcion", monto: 240, estado: "ACTIVO" });
    const database = new MemoryDatabase(data);
    const audit = new AuditoriaService(database as unknown as ExcelDatabaseService);
    service = new OperacionesService(database as unknown as ExcelDatabaseService, audit);
  });

  it("creates an enrollment and its payment order atomically", async () => {
    const result = await service.crearInscripcion({ idPostulante: 1, idConvocatoria: 1, idCarrera: 1, modalidad: "ORDINARIO" }, user);

    expect(result.inscripcion.estado).toBe("PENDIENTE_PAGO");
    expect(result.orden).toMatchObject({ codigo: "OP-2026-000001", monto: 240, estado: "PENDIENTE" });
    expect(data.auditoria).toHaveLength(1);
  });

  it("updates order, enrollment, cash and audit when a payment succeeds", async () => {
    await service.crearInscripcion({ idPostulante: 1, idConvocatoria: 1, idCarrera: 1, modalidad: "ORDINARIO" }, user);
    await service.abrirCaja({ saldoInicial: 100 }, user);

    const payment = await service.registrarPago({ idOrden: 1, monto: 240, metodoPago: "EFECTIVO" }, user);

    expect(payment.estado).toBe("CONFIRMADO");
    expect(data.ordenes_pago[0].estado).toBe("PAGADA");
    expect(data.inscripciones[0].estado).toBe("PAGADO");
    expect(data.movimientos_caja[0]).toMatchObject({ tipo: "INGRESO", monto: 240 });
  });

  it("requires confirmation before registering a result", async () => {
    await service.crearInscripcion({ idPostulante: 1, idConvocatoria: 1, idCarrera: 1, modalidad: "ORDINARIO" }, user);
    await service.abrirCaja({ saldoInicial: 0 }, user);
    await service.registrarPago({ idOrden: 1, monto: 240, metodoPago: "EFECTIVO" }, user);
    await service.confirmarInscripcion(1, user);

    const result = await service.registrarResultado({ idInscripcion: 1, puntaje: 75.5, puesto: 3, condicion: "INGRESANTE" }, user);

    expect(result).toMatchObject({ id_inscripcion: 1, condicion: "INGRESANTE" });
  });

  it("groups postulantes by year and buckets scores", async () => {
    data.postulantes.push(
      { id_postulante: 2, dni: "11111111", nombres: "Ana", apellidos: "Paz", convocatoria: "2025-I", facultad: "Ingenieria", tipo_colegio: "Estatal", puntaje: 12 },
      { id_postulante: 3, dni: "22222222", nombres: "Luis", apellidos: "Sol", convocatoria: "2025-II", facultad: "Ingenieria", tipo_colegio: "Privado", puntaje: 18 },
    );

    const dashboard = await service.dashboard({});

    expect(dashboard.porAnio).toEqual([
      { label: "2025", value: 2 },
      { label: "SIN AÑO", value: 1 },
    ]);
    expect(dashboard.distribucionPuntajes).toEqual([
      { label: "0 – 10", value: 0 },
      { label: "11 – 13", value: 1 },
      { label: "14 – 16", value: 0 },
      { label: "17 – 20", value: 1 },
    ]);
    expect(dashboard.conPuntaje).toBe(2);
    expect(dashboard.filtros.anios).toEqual(["2025"]);
  });

  it("filters postulante charts by facultad and tipo de colegio", async () => {
    data.postulantes.push(
      { id_postulante: 2, dni: "11111111", nombres: "Ana", apellidos: "Paz", convocatoria: "2025-I", facultad: "Ingenieria", tipo_colegio: "Estatal", puntaje: 12 },
      { id_postulante: 3, dni: "22222222", nombres: "Luis", apellidos: "Sol", convocatoria: "2025-I", facultad: "Derecho", tipo_colegio: "Privado", puntaje: 15 },
    );

    const dashboard = await service.dashboard({ facultad: "ingenieria", tipoColegio: "estatal" });

    expect(dashboard.postulantes).toBe(1);
    expect(dashboard.porFacultad).toEqual([{ label: "INGENIERIA", value: 1 }]);
  });
});
