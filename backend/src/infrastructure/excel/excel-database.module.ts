import { Global, Module } from "@nestjs/common";
import { ExcelDatabaseService } from "./excel-database.service";

@Global()
@Module({
  providers: [ExcelDatabaseService],
  exports: [ExcelDatabaseService],
})
export class ExcelDatabaseModule {}
