import type {
  PokemonGenerationOption,
  PokemonTypeOption,
} from '../types/pokemon';

export type PokedexOrder =
  | 'POKEDEX'
  | 'RECOMMENDATION';

interface PokedexFiltersProps {
  search: string;
  selectedType: string;
  selectedGeneration: string;
  order: PokedexOrder;

  recommendationOrderAvailable:
    boolean;

  types: PokemonTypeOption[];

  generations:
    PokemonGenerationOption[];

  onSearchChange: (
    value: string,
  ) => void;

  onTypeChange: (
    value: string,
  ) => void;

  onGenerationChange: (
    value: string,
  ) => void;

  onOrderChange: (
    value: PokedexOrder,
  ) => void;
}

export function PokedexFilters({
  search,
  selectedType,
  selectedGeneration,
  order,
  recommendationOrderAvailable,
  types,
  generations,
  onSearchChange,
  onTypeChange,
  onGenerationChange,
  onOrderChange,
}: PokedexFiltersProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label
          htmlFor="pokemon-search"
          className="sr-only"
        >
          Search Pokemon
        </label>

        <input
          id="pokemon-search"
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
          placeholder="Search by name or Pokédex number..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 hover:border-zinc-700 focus:border-zinc-500"
        />
      </div>

      <div className="sm:w-48">
        <label
          htmlFor="pokemon-type"
          className="sr-only"
        >
          Filter by type
        </label>

        <select
          id="pokemon-type"
          value={
            selectedType
          }
          onChange={(event) =>
            onTypeChange(
              event.target.value,
            )
          }
          className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
        >
          <option value="">
            All types
          </option>

          {types.map(
            (type) => (
              <option
                key={
                  type.id
                }
                value={
                  type.name
                }
              >
                {formatName(
                  type.name,
                )}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="sm:w-48">
        <label
          htmlFor="pokemon-generation"
          className="sr-only"
        >
          Filter by generation
        </label>

        <select
          id="pokemon-generation"
          value={
            selectedGeneration
          }
          onChange={(event) =>
            onGenerationChange(
              event.target.value,
            )
          }
          className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
        >
          <option value="">
            All generations
          </option>

          {generations.map(
            (generation) => (
              <option
                key={
                  generation.id
                }
                value={
                  generation.id
                }
              >
                Generation{' '}
                {generation.id}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="sm:w-52">
        <label
          htmlFor="pokemon-order"
          className="sr-only"
        >
          Order Pokemon
        </label>

        <select
          id="pokemon-order"
          value={order}
          onChange={(
            event,
          ) =>
            onOrderChange(
              event.target
                .value as PokedexOrder,
            )
          }
          className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
        >
          <option value="POKEDEX">
            Pokédex number
          </option>

          <option
            value="RECOMMENDATION"
            disabled={
              !recommendationOrderAvailable
            }
          >
            Recommendation plan
          </option>
        </select>
      </div>
    </div>
  );
}

function formatName(
  value: string,
) {
  return value
    .split('-')
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}