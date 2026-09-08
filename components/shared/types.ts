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

export interface BreakdownItem {
  label: string;
  value: number;
}

export interface ConvocatoriaSummaryRow {
  convocatoria: string;
  totalPostulantes: number;
  ingresantes: number;
  noIngresantes: number;
  porcentajeIngreso: number;
  puntajePromedio: number;
  recaudacionTotal: number;
}

export interface DashboardFilters {
  anios: string[];
  facultades: string[];
  tiposColegio: string[];
  convocatorias: string[];
  carreras: string[];
  estadosAnaliticos: string[];
}

export interface DashboardSelection {
  anio: string;
  facultad: string;
  tipoColegio: string;
  convocatoria: string;
  carrera: string;
  estadoAnalitico: string;
}

export interface AcademicMetrics {
  puntajePromedio: number;
  puntajeMaximo: number;
  puntajeMinimo: number;
  puntajePromedioIngresantes: number;
  puntajePromedioNoIngresantes: number;
  distribucionRangoPuntaje?: {
    rango: string;
    ingresantes: number;
    noIngresantes: number;
    enProceso: number;
  }[];
  puntajePorCarrera?: {
    carrera: string;
    ingresante: number;
    noIngresante: number;
    enProceso: number;
  }[];
  demandaDesempeno?: {
    carrera: string;
    facultad: string;
    totalPostulantes: number;
    puntajePromedio: number;
  }[];
  matrizFacultades?: {
    facultad: string;
    totalPostulantes: number;
    ingresantes: number;
    porcentajeIngreso: number;
    puntajePromedio: number;
  }[];
  resultadoTipoColegio?: {
    tipoColegio: string;
    ingresantes: number;
    noIngresantes: number;
    enProceso: number;
  }[];
}

export interface AnalisisEconomico {
  recaudacionPorConvocatoria?: BreakdownItem[];
  recaudacionPorTipoColegio?: BreakdownItem[];
  recaudacionPorFacultad?: BreakdownItem[];
  recaudacionPorMetodo?: BreakdownItem[];
  recaudacionPorEstado?: BreakdownItem[];
  totalRecaudacion?: number;
  totalPagosConfirmados?: number;
  promedioPorPostulante?: number;
  posConCosto?: number;
  sumaCostos?: number;
  usaFuenteReal?: boolean;
}

export interface DashboardData {
  postulantes: number;
  inscripciones: number;
  ordenesPendientes: number;
  pagos: number;
  recaudacion: number;
  ingresantes: number;
  totalCarreras?: number;
  porcentajeIngreso?: number;
  puntajePromedio?: number;
  porFacultad?: BreakdownItem[];
  porTipoColegio?: BreakdownItem[];
  porEstadoInscripcion?: BreakdownItem[];
  recaudacionPorMetodo?: BreakdownItem[];
  pagosPorDia?: BreakdownItem[];
  resultadosPorCondicion?: BreakdownItem[];
  porEstadoAnalitico?: BreakdownItem[];
  porConvocatoria?: BreakdownItem[];
  matrizConvocatorias?: ConvocatoriaSummaryRow[];
  porAnio?: BreakdownItem[];
  distribucionPuntajes?: BreakdownItem[];
  conPuntaje?: number;
  sinPuntaje?: number;
  filtros?: DashboardFilters;
  analisisAcademico?: AcademicMetrics;
  analisisEconomico?: AnalisisEconomico;
}

export type Submit = (
  path: string,
  data: Row,
  success: string,
  method?: string,
) => Promise<boolean>;
export type Api = <T>(path: string, init?: RequestInit) => Promise<T>;
