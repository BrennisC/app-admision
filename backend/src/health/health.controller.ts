import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.decorators";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Comprueba el estado de la API" })
  getHealth() {
    return {
      status: "ok",
      service: "admision-api",
      timestamp: new Date().toISOString(),
    };
  }
}
