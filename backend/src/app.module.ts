import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { PostulantesModule } from "./postulantes/postulantes.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PostulantesModule],
  controllers: [HealthController],
})
export class AppModule {}
