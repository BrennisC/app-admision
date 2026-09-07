import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const configuredPath = config.get<string>("WORKBOOK_PATH");
        const rootCandidate = resolve(process.cwd(), "postulantes.xlsx");
        const workbookPath = configuredPath
          ? resolve(process.cwd(), configuredPath)
          : existsSync(rootCandidate)
            ? rootCandidate
            : resolve(process.cwd(), "..", "postulantes.xlsx");
        return new ExcelPostulanteRepository(workbookPath);
      },
    },
  ],
})
export class PostulantesModule {}
