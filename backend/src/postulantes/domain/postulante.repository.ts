import type {
  PaginatedPostulantes,
  Postulante,
  PostulantesQuery,
} from "./postulante";

export const POSTULANTE_REPOSITORY = Symbol("POSTULANTE_REPOSITORY");

export interface PostulanteRepository {
  findAll(query: PostulantesQuery): Promise<PaginatedPostulantes>;
  findById(id: number): Promise<Postulante | null>;
  findByDni(dni: string): Promise<Postulante | null>;
}
