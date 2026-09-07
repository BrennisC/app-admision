import { copyFile, mkdir, rename, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as ExcelJS from "exceljs";
import { cellText, loadCompatibleWorkbook } from "./excel-postulante.repository";
import {
  type CellScalar,
  type DataRow,
  SHEET_HEADERS,
  type WorkbookData,
} from "./excel-database.types";

@Injectable()
export class ExcelDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(ExcelDatabaseService.name);
  private readonly workbookPath: string;
  private readonly sourcePath: string;
  private readonly backupPath: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private cache?: { modifiedAt: number; data: WorkbookData };
  private pendingLoad?: Promise<WorkbookData>;

  constructor(config: ConfigService) {
    const root = basename(process.cwd()) === "backend" ? resolve(process.cwd(), "..") : process.cwd();
    this.workbookPath = resolve(root, config.get("WORKBOOK_PATH", "data/sistema_admision.xlsx"));
    this.sourcePath = resolve(root, config.get("SOURCE_WORKBOOK_PATH", "postulantes.xlsx"));
    this.backupPath = resolve(root, config.get("BACKUP_PATH", "data/backups"));
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  get path(): string {
    return this.workbookPath;
  }

  async read<T>(reader: (data: WorkbookData) => T): Promise<T> {
    await this.writeQueue;
    return reader(await this.getData());
  }

  async transaction<T>(mutation: (data: WorkbookData) => T | Promise<T>): Promise<T> {
    let resolveResult!: (value: T | PromiseLike<T>) => void;
    let rejectResult!: (reason?: unknown) => void;
    const result = new Promise<T>((resolvePromise, rejectPromise) => {
      resolveResult = resolvePromise;
      rejectResult = rejectPromise;
    });

    this.writeQueue = this.writeQueue
      .then(async () => {
        try {
          const data = structuredClone(await this.getData());
          const value = await mutation(data);
          await this.saveData(data);
          this.cache = { modifiedAt: (await stat(this.workbookPath)).mtimeMs, data };
          resolveResult(value);
        } catch (error) {
          rejectResult(error);
        }
      })
      .catch((error: unknown) => {
        this.logger.error("Unexpected write queue failure", error);
      });
    return result;
  }

  private async initialize(): Promise<void> {
    if (existsSync(this.workbookPath)) return;
    await mkdir(dirname(this.workbookPath), { recursive: true });
    await mkdir(this.backupPath, { recursive: true });

    const data = emptyWorkbookData();
    if (existsSync(this.sourcePath)) {
      const source = await loadCompatibleWorkbook(this.sourcePath);
      const sheet = source.getWorksheet("postulantes");
      if (!sheet) throw new Error('El archivo fuente no contiene la hoja "postulantes"');
      const headers = new Map<string, number>();
      sheet.getRow(1).eachCell((cell, column) => headers.set(normalizeHeader(cellText(cell.value)), column));
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const get = (name: string) => cellText(row.getCell(headers.get(name) ?? 0).value);
        const id = Number(get("id")) || rowNumber - 1;
        data.postulantes.push({
          id_postulante: id,
          dni: get("dni"),
          nombres: get("nombres"),
          apellidos: get("apellidos"),
          tipo_colegio: get("tipo_de_colegio"),
          telefono: "",
          correo: "",
          direccion: "",
          fecha_nacimiento: "",
          estado: get("estado") || "ACTIVO",
          convocatoria: get("convocatoria"),
          facultad: get("facultad"),
          carrera: get("carrera"),
          costo: numeric(get("costo")),
          voucher: get("voucher"),
          fecha: get("fecha"),
          puntaje: numeric(get("puntaje")),
        });
      });
      seedCatalogs(data);
    }
    data.conceptos_pago.push({ id_concepto: 1, codigo: "ADM001", descripcion: "Derecho de inscripcion", monto: 240, estado: "ACTIVO" });
    await this.saveData(data, false);
    this.cache = { modifiedAt: (await stat(this.workbookPath)).mtimeMs, data };
    this.logger.log(`Libro operativo creado con ${data.postulantes.length} postulantes`);
  }

  private async loadData(): Promise<WorkbookData> {
    const workbook = await loadCompatibleWorkbook(this.workbookPath);
    const data = emptyWorkbookData();
    for (const [sheetName, expectedHeaders] of Object.entries(SHEET_HEADERS)) {
      const sheet = workbook.getWorksheet(sheetName);
      if (!sheet) continue;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => headers.push(cellText(cell.value)));
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record: DataRow = {};
        expectedHeaders.forEach((header, index) => {
          record[header] = scalar(row.getCell(index + 1).value);
        });
        if (Object.values(record).some((value) => value !== "" && value !== null)) data[sheetName].push(record);
      });
      if (headers.join("|") !== expectedHeaders.join("|")) {
        throw new Error(`La estructura de la hoja ${sheetName} no coincide con el sistema`);
      }
    }
    return data;
  }

  private async getData(): Promise<WorkbookData> {
    const modifiedAt = (await stat(this.workbookPath)).mtimeMs;
    if (this.cache?.modifiedAt === modifiedAt) return this.cache.data;
    if (!this.pendingLoad) {
      this.pendingLoad = this.loadData().then((data) => {
        this.cache = { modifiedAt, data };
        return data;
      }).finally(() => { this.pendingLoad = undefined; });
    }
    return this.pendingLoad;
  }

  private async saveData(data: WorkbookData, createBackup = true): Promise<void> {
    await mkdir(dirname(this.workbookPath), { recursive: true });
    await mkdir(this.backupPath, { recursive: true });
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Admision";
    workbook.created = new Date();
    for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.addRow(headers);
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF123F32" } };
      for (const record of data[sheetName] ?? []) sheet.addRow(headers.map((header) => record[header] ?? ""));
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = { from: "A1", to: sheet.getRow(1).getCell(headers.length).address };
      sheet.columns.forEach((column) => { column.width = 18; });
    }

    const temporaryPath = `${this.workbookPath}.${randomUUID()}.tmp`;
    await workbook.xlsx.writeFile(temporaryPath);
    if (!existsSync(this.workbookPath)) {
      await rename(temporaryPath, this.workbookPath);
      return;
    }

    if (createBackup) {
      const info = await stat(this.workbookPath);
      const stamp = new Date(info.mtimeMs).toISOString().replace(/[:.]/g, "-");
      await copyFile(this.workbookPath, resolve(this.backupPath, `sistema_admision-${stamp}-${randomUUID().slice(0, 8)}.xlsx`));
    }
    const previousPath = `${this.workbookPath}.previous`;
    await rm(previousPath, { force: true });
    await rename(this.workbookPath, previousPath);
    try {
      await rename(temporaryPath, this.workbookPath);
      await rm(previousPath, { force: true });
    } catch (error) {
      await rename(previousPath, this.workbookPath);
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }
}

function emptyWorkbookData(): WorkbookData {
  return Object.fromEntries(Object.keys(SHEET_HEADERS).map((sheet) => [sheet, []]));
}

function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function numeric(value: string): number | null {
  if (!value) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function scalar(value: ExcelJS.CellValue): CellScalar {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return cellText(value);
}

function seedCatalogs(data: WorkbookData): void {
  const convocatoriaNames = [...new Set(data.postulantes.map((row) => String(row.convocatoria)).filter(Boolean))].sort();
  convocatoriaNames.forEach((nombre, index) => data.convocatorias.push({
    id_convocatoria: index + 1, nombre, fecha_inicio: "", fecha_fin: "", fecha_examen: "", estado: "ACTIVO",
  }));

  const facultyNames = [...new Set(data.postulantes.map((row) => String(row.facultad)).filter(Boolean))].sort();
  facultyNames.forEach((nombre, index) => data.facultades.push({ id_facultad: index + 1, nombre, estado: "ACTIVO" }));
  const facultyIds = new Map(data.facultades.map((row) => [String(row.nombre), Number(row.id_facultad)]));
  const careers = new Map<string, string>();
  data.postulantes.forEach((row) => {
    const name = String(row.carrera);
    if (name && !careers.has(name)) careers.set(name, String(row.facultad));
  });
  [...careers.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([nombre, facultad], index) => {
    data.carreras.push({
      id_carrera: index + 1,
      codigo: `CAR${String(index + 1).padStart(3, "0")}`,
      id_facultad: facultyIds.get(facultad) ?? 0,
      facultad,
      nombre,
      estado: "ACTIVO",
    });
  });
}
