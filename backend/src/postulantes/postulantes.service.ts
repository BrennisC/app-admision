import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaginatedPostulantes, Postulante } from "./domain/postulante";
import {
  POSTULANTE_REPOSITORY,
  type PostulanteRepository,
} from "./domain/postulante.repository";
import type { ListarPostulantesQueryDto } from "./dto/listar-postulantes.query";

@Injectable()
export class PostulantesService {
  constructor(
    @Inject(POSTULANTE_REPOSITORY)
    private readonly repository: PostulanteRepository,
  ) {}

  findAll(query: ListarPostulantesQueryDto): Promise<PaginatedPostulantes> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<Postulante> {
    const postulante = await this.repository.findById(id);
    if (!postulante) {
      throw new NotFoundException(`No existe el postulante ${id}`);
    }
    return postulante;
  }

  async findByDni(dni: string): Promise<Postulante> {
    const postulante = await this.repository.findByDni(dni);
    if (!postulante) {
      throw new NotFoundException(`No existe un postulante con DNI ${dni}`);
    }
    return postulante;
  }
}
