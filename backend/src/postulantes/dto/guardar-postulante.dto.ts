import { PartialType } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CrearPostulanteDto {
  @IsString()
  @Length(8, 8)
  dni!: string;

  @IsString()
  @MaxLength(120)
  nombres!: string;

  @IsString()
  @MaxLength(120)
  apellidos!: string;

  @IsOptional()
  @IsIn(["ESTATAL", "PRIVADO"])
  tipoColegio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  fechaNacimiento?: string;
}

export class ActualizarPostulanteDto extends PartialType(CrearPostulanteDto) {}
