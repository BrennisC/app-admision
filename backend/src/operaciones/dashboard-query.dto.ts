import { IsOptional, IsString } from "class-validator";

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  anio?: string;

  @IsOptional()
  @IsString()
  facultad?: string;

  @IsOptional()
  @IsString()
  tipoColegio?: string;
}
