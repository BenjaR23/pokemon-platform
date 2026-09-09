import { useEffect, useState } from "react";
import { PokemonList } from "../components/PokemonList";
import type {
  PokemonListItem,
  PokemonListResponse,
  PokemonTypeOption,
  PokemonGenerationOption,
} from "../types/pokemon";
import { PokemonListLoader } from "../components/PokemonListLoader";

export function PokedexPage() {
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [types, setTypes] = useState<PokemonTypeOption[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [generations, setGenerations] = useState<PokemonGenerationOption[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [typesResponse, generationsResponse] = await Promise.all([
          fetch('http://localhost:3000/pokemon/types'),
          fetch('http://localhost:3000/pokemon/generations'),
        ]);

        if (!typesResponse.ok) {
          throw new Error('Failed to fetch Pokemon types');
        }

        if (!generationsResponse.ok) {
          throw new Error('Failed to fetch Pokemon generations');
        }

        const typesData: PokemonTypeOption[] =
          await typesResponse.json();

        const generationsData: PokemonGenerationOption[] =
          await generationsResponse.json();

        setTypes(typesData);
        setGenerations(generationsData);
      } catch {
        setError('Could not load Pokemon filters.');
      }
    }

    void fetchFilters();
  }, []);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '24',
        });

        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }

        if (selectedType) {
          params.set('type', selectedType);
        }

        if (selectedGeneration) {
          params.set('generation', selectedGeneration);
        }

        const response = await fetch(
          `http://localhost:3000/pokemon?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Pokemon');
        }

        const data: PokemonListResponse = await response.json();

        setPokemon(data.items);
        setTotalPages(data.pagination.totalPages);
      } catch {
        setError('Could not load Pokemon.');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPokemon();
  }, [page, debouncedSearch, selectedType, selectedGeneration]);

  const isSearchPending = search.trim() !== debouncedSearch;
  const showLoader = isLoading || isSearchPending;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Pokemon Database
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Pokedex
          </h1>
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
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
                value={selectedType}
                onChange={(event) => {
                  setSelectedType(event.target.value);
                  setPage(1);
                }}
                className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
              >
                <option value="">
                  All types
                </option>

                {types.map((type) => (
                  <option key={type.id} value={type.name}>
                    {formatName(type.name)}
                  </option>
                ))}
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
                value={selectedGeneration}
                onChange={(event) => {
                  setSelectedGeneration(event.target.value);
                  setPage(1);
                }}
                className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
              >
                <option value="">
                  All generations
                </option>

                {generations.map((generation) => (
                  <option
                    key={generation.id}
                    value={generation.id}
                  >
                    Generation {generation.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 py-16 text-center">
            <p className="text-zinc-400">
              {error}
            </p>
          </div>
        ) : showLoader ? (
          <PokemonListLoader />
        ) : pokemon.length === 0 ? (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 py-16 text-center">
            <p className="text-zinc-400">
              No Pokemon found.
            </p>
          </div>
        ) : (
          <PokemonList pokemon={pokemon} />
        )}

        {!showLoader && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => currentPage - 1)
              }
              disabled={page === 1}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-zinc-400">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => currentPage + 1)
              }
              disabled={page === totalPages}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function formatName(value: string) {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}