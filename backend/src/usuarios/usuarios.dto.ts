import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CrearUsuarioDto {
  @IsString() @MinLength(3) @MaxLength(40) username!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
  @IsString() @MaxLength(120) nombre!: string;
  @IsIn(["ADMIN", "ADMISION", "TESORERIA", "CAJERO", "CONSULTA"])
  rol!: string;
}
