import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateGameDayDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(['prepare', 'playing', 'finish'])
  status?: string;
}
