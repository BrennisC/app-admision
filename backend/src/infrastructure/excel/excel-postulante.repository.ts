import { readFile, stat } from "node:fs/promises";
import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import type { CellValue, Row } from "exceljs";
import JSZip = require("jszip");
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
    const searchTerms = normalize(query.search ?? "").split(/\s+/).filter(Boolean);
    const estado = normalize(query.estado ?? "");
    const filtered = rows.filter((postulante) => {
      const searchable = normalize(
        `${postulante.dni} ${postulante.nombres} ${postulante.apellidos} ${postulante.carrera}`,
      );
      const matchesSearch = searchTerms.every((term) => searchable.includes(term));
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
    const workbook = await loadCompatibleWorkbook(this.workbookPath);
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

export async function loadCompatibleWorkbook(path: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(path);
    return workbook;
  } catch (error) {
    const source = await readFile(path);
    const zip = await JSZip.loadAsync(source);
    const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
    if (!workbookXml?.includes("<x:workbook")) throw error;

    const names = Object.keys(zip.files).filter(
      (name) => name.startsWith("xl/") && name.endsWith(".xml"),
    );
    await Promise.all(
      names.map(async (name) => {
        const entry = zip.file(name);
        if (!entry) return;
        const xml = await entry.async("string");
        if (!xml.includes("<x:")) return;
        const compatibleXml = xml
          .replace(/<(\/?)x:/g, "<$1")
          .replace(
            'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
            'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
          )
          .replace(/<tableParts\b[\s\S]*?<\/tableParts>/g, "");
        zip.file(name, compatibleXml);
      }),
    );

    const normalized = await zip.generateAsync({ type: "nodebuffer" });
    const compatibleWorkbook = new ExcelJS.Workbook();
    await compatibleWorkbook.xlsx.load(new Uint8Array(normalized).buffer);
    return compatibleWorkbook;
  }
}

function buildHeaderMap(row: Row): Map<string, number> {
  const headers = new Map<string, number>();
  row.eachCell((cell, column) => {
    const key = headerKey(cellText(cell.value));
    headers.set(key, column);
    if (key === "id_postulante") headers.set("id", column);
  });
  return headers;
}

function mapPostulante(
  row: Row,
  headers: Map<string, number>,
  fallbackId: number,
): Postulante {
  const cellValue = (header: string): CellValue => {
    const col = headers.get(header);
    if (col === undefined) return null;
    return row.getCell(col).value;
  };
  const text = (header: string) => cellText(cellValue(header));
  const id = numberValue(cellValue("id"));

  return {
    id: id ?? fallbackId,
    convocatoria: text("convocatoria"),
    nombres: text("nombres"),
    apellidos: text("apellidos"),
    dni: text("dni"),
    facultad: text("facultad"),
    carrera: text("carrera"),
    tipoColegio: text("tipo_de_colegio"),
    costo: numberValue(cellValue("costo")),
    voucher: text("voucher"),
    fecha: dateValue(cellValue("fecha")),
    puntaje: numberValue(cellValue("puntaje")),
    estado: text("estado"),
  };
}

function hasContent(row: Row): boolean {
  for (let column = 1; column <= row.cellCount; column += 1) {
    if (cellText(row.getCell(column).value) !== "") return true;
  }
  return false;
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

export function cellText(value: CellValue): string {
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
  const text = cellText(value);
  if (!text) return null;
  const parsed = Number(text.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: CellValue): string | null {
  if (value instanceof Date) return value.toISOString();
  const text = cellText(value);
  return text || null;
}
