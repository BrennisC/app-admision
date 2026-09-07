import { Module } from "@nestjs/common";
import { ExcelDatabaseService } from "../infrastructure/excel/excel-database.service";
import { ExcelPostulanteRepository } from "../infrastructure/excel/excel-postulante.repository";
import { POSTULANTE_REPOSITORY } from "./domain/postulante.repository";
import { PostulantesController } from "./postulantes.controller";
import { PostulantesService } from "./postulantes.service";

@Module({
  controllers: [PostulantesController],
  providers: [
    PostulantesService,
    {
      provide: POSTULANTE_REPOSITORY,
      inject: [ExcelDatabaseService],
      useFactory: (database: ExcelDatabaseService) => new ExcelPostulanteRepository(database.path),
    },
  ],
})
export class PostulantesModule {}
