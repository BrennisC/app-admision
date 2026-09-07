export type Row = Record<string, string | number | boolean | null>;

export interface Catalogs {
  convocatorias: Row[];
  facultades: Row[];
  carreras: Row[];
  conceptosPago: Row[];
}

export interface Resources {
  catalogos: Catalogs;
  inscripciones: Row[];
  ordenes: Row[];
  cajas: Row[];
  pagos: Row[];
  resultados: Row[];
  auditoria: Row[];
  usuarios: Row[];
  dashboard: Row;
}

export interface Applicant {
  id: number;
  convocatoria: string;
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  tipoColegio: string;
  puntaje: number | null;
  estado: string;
}

export interface ApplicantsResponse {
  data: Applicant[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DashboardData {
  postulantes: number;
  inscripciones: number;
  ordenesPendientes: number;
  pagos: number;
  recaudacion: number;
  ingresantes: number;
}

export type Submit = (path: string, data: Row, success: string, method?: string) => Promise<boolean>;
export type Api = <T>(path: string, init?: RequestInit) => Promise<T>;
