import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { ExcelDatabaseModule } from "./infrastructure/excel/excel-database.module";
import { PostulantesModule } from "./postulantes/postulantes.module";
import { AuthModule } from "./auth/auth.module";
import { AuditoriaModule } from "./auditoria/auditoria.module";
import { OperacionesModule } from "./operaciones/operaciones.module";
import { UsuariosModule } from "./usuarios/usuarios.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ExcelDatabaseModule,
    AuditoriaModule,
    AuthModule,
    PostulantesModule,
    OperacionesModule,
    UsuariosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
