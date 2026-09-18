import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class UpdateProfileGamesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  primaryGameIds!: number[];

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  auxiliaryGameIds!: number[];
}
