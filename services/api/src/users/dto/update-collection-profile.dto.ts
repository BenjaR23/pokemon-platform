import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type CollectionObjectiveMode = 'ALL' | 'GENERATIONS' | 'RANGE';

export class UpdateCollectionProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsIn(['ALL', 'GENERATIONS', 'RANGE'])
  objectiveMode?: CollectionObjectiveMode;

  @ValidateIf(
    (dto: UpdateCollectionProfileDto) => dto.objectiveMode === 'GENERATIONS',
  )
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  generationIds?: number[];

  @ValidateIf(
    (dto: UpdateCollectionProfileDto) => dto.objectiveMode === 'RANGE',
  )
  @IsInt()
  @Min(1)
  startPokemonNumber?: number;

  @ValidateIf(
    (dto: UpdateCollectionProfileDto) => dto.objectiveMode === 'RANGE',
  )
  @IsInt()
  @Min(1)
  endPokemonNumber?: number;
}
