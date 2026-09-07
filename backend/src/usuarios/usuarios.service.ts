import { ConflictException, Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";
import { AuditoriaService } from "../auditoria/auditoria.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { nextId } from "../infrastructure/excel/excel-database.types";
import type { CrearUsuarioDto } from "./usuarios.dto";

@Injectable()
export class UsuariosService {
  constructor(private readonly database: ExcelDatabaseService, private readonly auditoria: AuditoriaService) {}

  list() {
    return this.database.read((data) => data.usuarios.map(({ password: _password, ...user }) => user));
  }

  async create(input: CrearUsuarioDto, actor: AuthenticatedUser) {
    const password = await hash(input.password, 12);
    return this.database.transaction((data) => {
      if (data.usuarios.some((row) => String(row.username).toLowerCase() === input.username.toLowerCase())) throw new ConflictException("El nombre de usuario ya existe");
      const id = nextId(data.usuarios, "id_usuario");
      const row = { id_usuario: id, username: input.username, password, nombre: input.nombre, rol: input.rol, estado: "ACTIVO" };
      data.usuarios.push(row);
      this.auditoria.append(data, { usuario: actor.username, accion: "CREAR", modulo: "USUARIOS", registro: String(id), detalle: `${input.username} - ${input.rol}` });
      const { password: _password, ...safeUser } = row;
      return safeUser;
    });
  }
}
