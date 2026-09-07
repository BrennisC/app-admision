import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ActualizarPostulanteDto, CrearPostulanteDto } from "./dto/guardar-postulante.dto";
import { ListarPostulantesQueryDto } from "./dto/listar-postulantes.query";
import { PostulantesService } from "./postulantes.service";

@ApiTags("postulantes")
@ApiBearerAuth()
@Controller("postulantes")
export class PostulantesController {
  constructor(private readonly postulantesService: PostulantesService) {}

  @Get()
  @ApiOperation({ summary: "Lista y filtra postulantes" })
  findAll(@Query() query: ListarPostulantesQueryDto) {
    return this.postulantesService.findAll(query);
  }

  @Get("dni/:dni")
  @ApiOperation({ summary: "Busca un postulante por DNI" })
  findByDni(@Param("dni") dni: string) {
    return this.postulantesService.findByDni(dni);
  }

  @Get(":id")
  @ApiOperation({ summary: "Busca un postulante por ID" })
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.postulantesService.findById(id);
  }

  @Post()
  @Roles("ADMIN", "ADMISION")
  create(@Body() input: CrearPostulanteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.postulantesService.create(input, user);
  }

  @Patch(":id")
  @Roles("ADMIN", "ADMISION")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ActualizarPostulanteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postulantesService.update(id, input, user);
  }
}
