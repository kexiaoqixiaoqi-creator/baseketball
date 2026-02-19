import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateGameDayDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(['pending', 'active', 'completed'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(10000)
  salaryCap?: number;
}
