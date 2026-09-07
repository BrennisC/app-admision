import { stat } from "node:fs/promises";
import { Injectable } from "@nestjs/common";
import ExcelJS, { type CellValue, type Row } from "exceljs";
import type {
  PaginatedPostulantes,
  Postulante,
  PostulantesQuery,
} from "../../postulantes/domain/postulante";
import type { PostulanteRepository } from "../../postulantes/domain/postulante.repository";

const REQUIRED_HEADERS = ["id", "nombres", "apellidos", "dni"];

@Injectable()
export class ExcelPostulanteRepository implements PostulanteRepository {
  private cache?: { modifiedAt: number; rows: Postulante[] };
  private pendingLoad?: Promise<Postulante[]>;

  constructor(private readonly workbookPath: string) {}

  async findAll(query: PostulantesQuery): Promise<PaginatedPostulantes> {
    const rows = await this.getRows();
    const search = normalize(query.search ?? "");
    const estado = normalize(query.estado ?? "");
    const filtered = rows.filter((postulante) => {
      const matchesSearch =
        !search ||
        normalize(
          `${postulante.dni} ${postulante.nombres} ${postulante.apellidos} ${postulante.carrera}`,
        ).includes(search);
      const matchesEstado = !estado || normalize(postulante.estado) === estado;
      return matchesSearch && matchesEstado;
    });
    const start = (query.page - 1) * query.limit;

    return {
      data: filtered.slice(start, start + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / query.limit),
      },
    };
  }

  async findById(id: number): Promise<Postulante | null> {
    return (await this.getRows()).find((row) => row.id === id) ?? null;
  }

  async findByDni(dni: string): Promise<Postulante | null> {
    return (await this.getRows()).find((row) => row.dni === dni.trim()) ?? null;
  }

  private async getRows(): Promise<Postulante[]> {
    const file = await stat(this.workbookPath);
    if (this.cache?.modifiedAt === file.mtimeMs) {
      return this.cache.rows;
    }
    if (!this.pendingLoad) {
      this.pendingLoad = this.loadRows(file.mtimeMs).finally(() => {
        this.pendingLoad = undefined;
      });
    }
    return this.pendingLoad;
  }

  private async loadRows(modifiedAt: number): Promise<Postulante[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.workbookPath);
    const worksheet = workbook.getWorksheet("postulantes");
    if (!worksheet) {
      throw new Error('El archivo XLSX no contiene la hoja "postulantes"');
    }

    const headers = buildHeaderMap(worksheet.getRow(1));
    for (const required of REQUIRED_HEADERS) {
      if (!headers.has(required)) {
        throw new Error(`Falta la columna obligatoria "${required}" en el XLSX`);
      }
    }

    const rows: Postulante[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || !hasContent(row)) return;
      rows.push(mapPostulante(row, headers, rowNumber - 1));
    });
    this.cache = { modifiedAt, rows };
    return rows;
  }
}

function buildHeaderMap(row: Row): Map<string, number> {
  const headers = new Map<string, number>();
  row.eachCell((cell, column) => {
    headers.set(headerKey(cellText(cell.value)), column);
  });
  return headers;
}

function mapPostulante(
  row: Row,
  headers: Map<string, number>,
  fallbackId: number,
): Postulante {
  const text = (header: string) => cellText(row.getCell(headers.get(header) ?? 0).value);
  const id = numberValue(row.getCell(headers.get("id") ?? 0).value);

  return {
    id: id ?? fallbackId,
    convocatoria: text("convocatoria"),
    nombres: text("nombres"),
    apellidos: text("apellidos"),
    dni: text("dni"),
    facultad: text("facultad"),
    carrera: text("carrera"),
    tipoColegio: text("tipo_de_colegio"),
    costo: numberValue(row.getCell(headers.get("costo") ?? 0).value),
    voucher: text("voucher"),
    fecha: dateValue(row.getCell(headers.get("fecha") ?? 0).value),
    puntaje: numberValue(row.getCell(headers.get("puntaje") ?? 0).value),
    estado: text("estado"),
  };
}

function hasContent(row: Row): boolean {
  return row.values.some((value) => cellText(value as CellValue) !== "");
}

function headerKey(value: string): string {
  return normalize(value).replace(/\s+/g, "_");
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value).trim();
  if ("result" in value) return cellText(value.result ?? null);
  if ("text" in value) return String(value.text).trim();
  if ("richText" in value) return value.richText.map((item) => item.text).join("").trim();
  return "";
}

function numberValue(value: CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(cellText(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: CellValue): string | null {
  if (value instanceof Date) return value.toISOString();
  const text = cellText(value);
  return text || null;
}
