import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CrearConvocatoriaDto {
  @IsString() @MaxLength(40) nombre!: string;
  @IsString() fechaInicio!: string;
  @IsString() fechaFin!: string;
  @IsString() fechaExamen!: string;
}

export class CrearCarreraDto {
  @IsString() @MaxLength(20) codigo!: string;
  @Type(() => Number) @IsInt() @IsPositive() idFacultad!: number;
  @IsString() @MaxLength(160) nombre!: string;
}

export class CrearConceptoPagoDto {
  @IsString() @MaxLength(20) codigo!: string;
  @IsString() @MaxLength(160) descripcion!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() monto!: number;
}

export class CrearInscripcionDto {
  @Type(() => Number) @IsInt() @IsPositive() idPostulante!: number;
  @Type(() => Number) @IsInt() @IsPositive() idConvocatoria!: number;
  @Type(() => Number) @IsInt() @IsPositive() idCarrera!: number;
  @IsString() @MaxLength(80) modalidad!: string;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() idConcepto?: number;
}

export class AbrirCajaDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) saldoInicial!: number;
}

export class CerrarCajaDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) saldoFinal!: number;
}

export class RegistrarPagoDto {
  @Type(() => Number) @IsInt() @IsPositive() idOrden!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() monto!: number;
  @IsIn(["EFECTIVO", "TRANSFERENCIA", "BANCO", "YAPE", "PLIN", "TARJETA"])
  metodoPago!: string;
  @IsOptional() @IsString() @MaxLength(100) voucher?: string;
}

export class RegistrarResultadoDto {
  @Type(() => Number) @IsInt() @IsPositive() idInscripcion!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) puntaje!: number;
  @Type(() => Number) @IsInt() @Min(0) puesto!: number;
  @IsIn(["INGRESANTE", "NO_INGRESANTE", "AUSENTE"])
  condicion!: string;
}
