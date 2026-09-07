import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const trimmedText = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() || undefined : value;

export class ListarPostulantesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @Transform(trimmedText)
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(trimmedText)
  @IsString()
  estado?: string;
}
