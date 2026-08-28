import { IsInt, Min } from 'class-validator';

export class SyncPokemonRangeDto {
  // El primer ID debe ser un entero positivo.
  @IsInt()
  @Min(1)
  startId!: number;

  // El ultimo ID tambien deber ser un entero posivito.
  @IsInt()
  @Min(1)
  endId!: number;
}
