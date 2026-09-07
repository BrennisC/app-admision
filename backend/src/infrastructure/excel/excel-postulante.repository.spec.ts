import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as ExcelJS from "exceljs";
import { ExcelPostulanteRepository } from "./excel-postulante.repository";

describe("ExcelPostulanteRepository", () => {
  let directory: string;
  let workbookPath: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "admision-test-"));
    workbookPath = join(directory, "postulantes.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("postulantes");
    sheet.addRow([
      "ID",
      "Convocatoria",
      "Nombres",
      "Apellidos",
      "DNI",
      "Facultad",
      "Carrera",
      "Tipo de colegio",
      "Costo",
      "Voucher",
      "Fecha",
      "Puntaje",
      "Estado",
    ]);
    sheet.addRow([
      1,
      "2026-I",
      "Victor Erick",
      "Rojas Diaz",
      "07369837",
      "Ingenieria",
      "Sistemas",
      "Estatal",
      240,
      "V-001",
      new Date("2026-09-07T00:00:00.000Z"),
      75.5,
      "Ingresante",
    ]);
    sheet.addRow([
      2,
      "2026-I",
      "Sofia",
      "Torres",
      "76374122",
      "Ingenieria",
      "Zootecnia",
      "Privado",
      240,
      "V-002",
      new Date("2026-09-07T00:00:00.000Z"),
      50,
      "No Ingresante",
    ]);
    await workbook.xlsx.writeFile(workbookPath);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("preserves textual DNI values and maps the historical columns", async () => {
    const repository = new ExcelPostulanteRepository(workbookPath);

    const result = await repository.findByDni("07369837");

    expect(result).toMatchObject({
      id: 1,
      dni: "07369837",
      nombres: "Victor Erick",
      carrera: "Sistemas",
      costo: 240,
      estado: "Ingresante",
    });
  });

  it("filters without accents and paginates the result", async () => {
    const repository = new ExcelPostulanteRepository(workbookPath);

    const result = await repository.findAll({
      page: 1,
      limit: 10,
      search: "victor sistemas",
    });

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(result.data[0].dni).toBe("07369837");
  });

  it("filters by status", async () => {
    const repository = new ExcelPostulanteRepository(workbookPath);

    const result = await repository.findAll({
      page: 1,
      limit: 10,
      estado: "no ingresante",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].nombres).toBe("Sofia");
  });
});
