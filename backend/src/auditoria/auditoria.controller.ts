import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/auth.decorators";
import { AuditoriaService } from "./auditoria.service";

@ApiTags("auditoria")
@ApiBearerAuth()
@Roles("ADMIN")
@Controller("auditoria")
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  list() {
    return this.auditoria.list();
  }
}
