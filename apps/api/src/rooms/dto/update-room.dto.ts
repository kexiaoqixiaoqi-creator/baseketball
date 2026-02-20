import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoomDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  salaryCapCoefficient?: number;
}
