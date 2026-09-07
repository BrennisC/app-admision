import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Comprueba el estado de la API" })
  getHealth() {
    return {
      status: "ok",
      service: "admision-api",
      timestamp: new Date().toISOString(),
    };
  }
}
