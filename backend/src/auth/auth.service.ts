import { Injectable, OnApplicationBootstrap, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { nextId } from "../infrastructure/excel/excel-database.types";
import type { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser, UserRole } from "./auth.types";

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    private readonly database: ExcelDatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const hasUsers = await this.database.read((data) => data.usuarios.length > 0);
    if (hasUsers) return;
    const username = this.config.get("ADMIN_USERNAME", "admin");
    const password = this.config.get("ADMIN_PASSWORD", "Admin123!");
    const passwordHash = await hash(password, 12);
    await this.database.transaction((data) => {
      if (data.usuarios.length) return;
      data.usuarios.push({
        id_usuario: nextId(data.usuarios, "id_usuario"),
        username,
        password: passwordHash,
        nombre: "Administrador",
        rol: "ADMIN",
        estado: "ACTIVO",
      });
    });
  }

  async login(input: LoginDto) {
    const user = await this.database.read((data) =>
      data.usuarios.find((candidate) => candidate.username === input.username && candidate.estado === "ACTIVO"),
    );
    if (!user || !(await compare(input.password, String(user.password)))) {
      throw new UnauthorizedException("Usuario o contrasena incorrectos");
    }
    const payload: AuthenticatedUser = {
      sub: Number(user.id_usuario),
      username: String(user.username),
      name: String(user.nombre),
      role: String(user.rol) as UserRole,
    };
    return { accessToken: await this.jwt.signAsync(payload), user: payload };
  }
}
