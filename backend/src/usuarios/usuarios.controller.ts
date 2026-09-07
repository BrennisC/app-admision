import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CrearUsuarioDto } from "./usuarios.dto";
import { UsuariosService } from "./usuarios.service";

@ApiTags("usuarios")
@ApiBearerAuth()
@Roles("ADMIN")
@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@Body() input: CrearUsuarioDto, @CurrentUser() user: AuthenticatedUser) { return this.service.create(input, user); }
}
