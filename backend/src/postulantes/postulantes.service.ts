import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuditoriaService } from "../auditoria/auditoria.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { nextId } from "../infrastructure/excel/excel-database.types";
import type { PaginatedPostulantes, Postulante } from "./domain/postulante";
import {
  POSTULANTE_REPOSITORY,
  type PostulanteRepository,
} from "./domain/postulante.repository";
import type { ListarPostulantesQueryDto } from "./dto/listar-postulantes.query";
import type { ActualizarPostulanteDto, CrearPostulanteDto } from "./dto/guardar-postulante.dto";

@Injectable()
export class PostulantesService {
  constructor(
    @Inject(POSTULANTE_REPOSITORY)
    private readonly repository: PostulanteRepository,
    private readonly database: ExcelDatabaseService,
    private readonly auditoria: AuditoriaService,
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

  create(input: CrearPostulanteDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      if (data.postulantes.some((row) => String(row.dni) === input.dni)) {
        throw new ConflictException(`Ya existe un postulante con DNI ${input.dni}`);
      }
      const id = nextId(data.postulantes, "id_postulante");
      const row = {
        id_postulante: id,
        dni: input.dni,
        nombres: input.nombres.trim(),
        apellidos: input.apellidos.trim(),
        tipo_colegio: input.tipoColegio ?? "",
        telefono: input.telefono ?? "",
        correo: input.correo ?? "",
        direccion: input.direccion ?? "",
        fecha_nacimiento: input.fechaNacimiento ?? "",
        estado: "ACTIVO",
        convocatoria: "",
        facultad: "",
        carrera: "",
        costo: null,
        voucher: "",
        fecha: new Date().toISOString(),
        puntaje: null,
      };
      data.postulantes.push(row);
      this.auditoria.append(data, {
        usuario: user.username, accion: "CREAR", modulo: "POSTULANTES", registro: String(id), detalle: `DNI ${input.dni}`,
      });
      return row;
    });
  }

  update(id: number, input: ActualizarPostulanteDto, user: AuthenticatedUser) {
    return this.database.transaction((data) => {
      const row = data.postulantes.find((candidate) => Number(candidate.id_postulante) === id);
      if (!row) throw new NotFoundException(`No existe el postulante ${id}`);
      if (input.dni && data.postulantes.some((candidate) => Number(candidate.id_postulante) !== id && candidate.dni === input.dni)) {
        throw new ConflictException(`Ya existe un postulante con DNI ${input.dni}`);
      }
      const fields: Record<string, unknown> = {
        dni: input.dni,
        nombres: input.nombres?.trim(),
        apellidos: input.apellidos?.trim(),
        tipo_colegio: input.tipoColegio,
        telefono: input.telefono,
        correo: input.correo,
        direccion: input.direccion,
        fecha_nacimiento: input.fechaNacimiento,
      };
      Object.entries(fields).forEach(([key, value]) => { if (value !== undefined) row[key] = String(value); });
      this.auditoria.append(data, {
        usuario: user.username, accion: "ACTUALIZAR", modulo: "POSTULANTES", registro: String(id), detalle: "Datos personales actualizados",
      });
      return row;
    });
  }
}
