import { Injectable } from "@nestjs/common";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { nextId, type WorkbookData } from "../infrastructure/excel/excel-database.types";

export interface AuditInput {
  usuario: string;
  accion: string;
  modulo: string;
  registro: string;
  detalle: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly database: ExcelDatabaseService) {}

  list() {
    return this.database.read((data) => [...data.auditoria].reverse().slice(0, 500));
  }

  record(input: AuditInput) {
    return this.database.transaction((data) => this.append(data, input));
  }

  append(data: WorkbookData, input: AuditInput): void {
    data.auditoria.push({
      id_auditoria: nextId(data.auditoria, "id_auditoria"),
      ...input,
      fecha: new Date().toISOString(),
    });
  }
}
