import { IsString, IsOptional, IsNumber, MinLength, MaxLength, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  salaryCapCoefficient?: number;

  @IsOptional()
  @IsNumber()
  ptsWeight?: number;

  @IsOptional()
  @IsNumber()
  rebWeight?: number;

  @IsOptional()
  @IsNumber()
  astWeight?: number;

  @IsOptional()
  @IsNumber()
  stlWeight?: number;

  @IsOptional()
  @IsNumber()
  blkWeight?: number;

  @IsOptional()
  @IsNumber()
  toWeight?: number;
}
