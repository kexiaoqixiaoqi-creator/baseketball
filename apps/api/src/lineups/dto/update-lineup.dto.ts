import { IsInt, IsPositive } from 'class-validator';

export class UpdateLineupDto {
  @IsInt()
  @IsPositive()
  pgId: number;

  @IsInt()
  @IsPositive()
  sgId: number;

  @IsInt()
  @IsPositive()
  sfId: number;

  @IsInt()
  @IsPositive()
  pfId: number;

  @IsInt()
  @IsPositive()
  cId: number;
}
