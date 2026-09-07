export interface Postulante {
  id: number;
  convocatoria: string;
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  tipoColegio: string;
  costo: number | null;
  voucher: string;
  fecha: string | null;
  puntaje: number | null;
  estado: string;
}

export interface PostulantesQuery {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
}

export interface PaginatedPostulantes {
  data: Postulante[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
