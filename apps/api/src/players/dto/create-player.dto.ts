import { IsString, IsEnum, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(['PG', 'SG', 'SF', 'PF', 'C'])
  position: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  team: string;

  @IsString()
  @MaxLength(10)
  jerseyNumber: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
