import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthenticatedUser } from "../auth/auth.types";
import {
  AbrirCajaDto,
  CerrarCajaDto,
  CrearCarreraDto,
  CrearConceptoPagoDto,
  CrearConvocatoriaDto,
  CrearInscripcionDto,
  RegistrarPagoDto,
  RegistrarResultadoDto,
} from "./operaciones.dto";
import { DashboardQueryDto } from "./dashboard-query.dto";
import { OperacionesService } from "./operaciones.service";

@ApiTags("operaciones")
@ApiBearerAuth()
@Controller()
export class OperacionesController {
  constructor(private readonly service: OperacionesService) {}

  @Get("catalogos") catalogos() { return this.service.catalogos(); }
  @Post("convocatorias") @Roles("ADMIN", "ADMISION") crearConvocatoria(@Body() dto: CrearConvocatoriaDto, @CurrentUser() user: AuthenticatedUser) { return this.service.crearConvocatoria(dto, user); }
  @Post("carreras") @Roles("ADMIN", "ADMISION") crearCarrera(@Body() dto: CrearCarreraDto, @CurrentUser() user: AuthenticatedUser) { return this.service.crearCarrera(dto, user); }
  @Post("conceptos-pago") @Roles("ADMIN", "TESORERIA") crearConcepto(@Body() dto: CrearConceptoPagoDto, @CurrentUser() user: AuthenticatedUser) { return this.service.crearConcepto(dto, user); }

  @Get("inscripciones") inscripciones() { return this.service.inscripciones(); }
  @Post("inscripciones") @Roles("ADMIN", "ADMISION") crearInscripcion(@Body() dto: CrearInscripcionDto, @CurrentUser() user: AuthenticatedUser) { return this.service.crearInscripcion(dto, user); }
  @Post("inscripciones/:id/confirmacion") @Roles("ADMIN", "ADMISION") confirmar(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) { return this.service.confirmarInscripcion(id, user); }
  @Get("ordenes-pago") ordenes() { return this.service.ordenes(); }

  @Get("cajas") @Roles("ADMIN", "TESORERIA", "CAJERO") cajas() { return this.service.cajas(); }
  @Post("cajas/apertura") @Roles("ADMIN", "CAJERO") abrirCaja(@Body() dto: AbrirCajaDto, @CurrentUser() user: AuthenticatedUser) { return this.service.abrirCaja(dto, user); }
  @Post("cajas/:id/cierre") @Roles("ADMIN", "CAJERO") cerrarCaja(@Param("id", ParseIntPipe) id: number, @Body() dto: CerrarCajaDto, @CurrentUser() user: AuthenticatedUser) { return this.service.cerrarCaja(id, dto, user); }
  @Get("pagos") @Roles("ADMIN", "TESORERIA", "CAJERO") pagos() { return this.service.pagos(); }
  @Get("pagos/:id/comprobante") @Roles("ADMIN", "TESORERIA", "CAJERO") comprobante(@Param("id", ParseIntPipe) id: number) { return this.service.comprobante(id); }
  @Post("pagos") @Roles("ADMIN", "CAJERO") registrarPago(@Body() dto: RegistrarPagoDto, @CurrentUser() user: AuthenticatedUser) { return this.service.registrarPago(dto, user); }

  @Get("resultados") resultados() { return this.service.resultados(); }
  @Post("resultados") @Roles("ADMIN", "ADMISION") registrarResultado(@Body() dto: RegistrarResultadoDto, @CurrentUser() user: AuthenticatedUser) { return this.service.registrarResultado(dto, user); }
  @Get("dashboard") dashboard(@Query() query: DashboardQueryDto) { return this.service.dashboard(query); }
  @Get("reportes/resumen") dashboardReport(@Query() query: DashboardQueryDto) { return this.service.dashboard(query); }
}
