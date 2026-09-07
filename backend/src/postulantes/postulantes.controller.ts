import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ListarPostulantesQueryDto } from "./dto/listar-postulantes.query";
import { PostulantesService } from "./postulantes.service";

@ApiTags("postulantes")
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
}
