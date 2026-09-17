import {
  useEffect,
  useState,
} from 'react';

import {
  getPokemon,
  getPokemonGenerations,
  getPokemonTypes,
} from '../api/pokemon.api';

import { Pagination } from '../components/Pagination';
import { PokedexFilters } from '../components/PokedexFilters';
import { PokemonList } from '../components/PokemonList';
import { PokemonListLoader } from '../components/PokemonListLoader';
import { useProfile } from '../profiles/useProfile';

import type {
  PokemonGenerationOption,
  PokemonListItem,
  PokemonTypeOption,
} from '../types/pokemon';

export function PokedexPage() {
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [types, setTypes] = useState<PokemonTypeOption[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [generations, setGenerations] = useState<PokemonGenerationOption[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState('');

  const [page, setPage] = useState(
    () => {
      const savedPage = Number(
        localStorage.getItem(
          'pokedex-page',
        ),
      );

      return Number.isInteger(
        savedPage,
      ) && savedPage > 0
        ? savedPage
        : 1;
    },
  );

  const { activeProfile } = useProfile();

  const [objectiveOnly, setObjectiveOnly] = useState(false);

  const objectiveGenerationIds =
    objectiveOnly &&
    activeProfile?.objectiveMode ===
      'GENERATIONS'
      ? activeProfile.generations.map(
          (entry) =>
            entry.generation.externalId,
        )
      : undefined;

  const objectiveMinPokemonId =
    objectiveOnly &&
    activeProfile?.objectiveMode === 'RANGE'
      ? activeProfile.startPokemonNumber ??
        undefined
      : undefined;

  const objectiveMaxPokemonId =
    objectiveOnly &&
    activeProfile?.objectiveMode === 'RANGE'
      ? activeProfile.endPokemonNumber ??
        undefined
      : undefined;

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        setDebouncedSearch(
          search.trim(),
        );
      },
      300,
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    localStorage.setItem(
      'pokedex-page',
      page.toString(),
    );
  }, [page]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [
          typesData,
          generationsData,
        ] = await Promise.all([
          getPokemonTypes(),
          getPokemonGenerations(),
        ]);

        setTypes(typesData);

        setGenerations(
          generationsData,
        );
      } catch {
        setError(
          'Could not load Pokemon filters.',
        );
      }
    }

    void fetchFilters();
  }, []);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getPokemon({
          page,
          pageSize: 24,
          search:
            debouncedSearch || undefined,
          type:
            selectedType || undefined,
          generation:
            selectedGeneration
              ? Number(selectedGeneration)
              : undefined,
          generationIds:
            objectiveGenerationIds,
          minPokemonId:
            objectiveMinPokemonId,
          maxPokemonId:
            objectiveMaxPokemonId,
        });

        setPokemon(data.items);

        setTotalPages(
          data.pagination.totalPages,
        );

        if (
          data.pagination.totalPages >
            0 &&
          page >
            data.pagination.totalPages
        ) {
          setPage(
            data.pagination
              .totalPages,
          );
        }
      } catch {
        setError(
          'Could not load Pokemon.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPokemon();
  }, [
    page,
    debouncedSearch,
    selectedType,
    selectedGeneration,
    objectiveOnly,
    objectiveGenerationIds,
    objectiveMaxPokemonId,
    objectiveMinPokemonId,
    activeProfile?.id,
    activeProfile?.objectiveMode,
    activeProfile?.startPokemonNumber,
    activeProfile?.endPokemonNumber,
    activeProfile?.generations,
  ]);

  const isSearchPending =
    search.trim() !==
    debouncedSearch;

  const showLoader =
    isLoading ||
    isSearchPending;

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

          {activeProfile && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Show
              </p>

              <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setObjectiveOnly(false);
                    setPage(1);
                  }}
                  className={
                    !objectiveOnly
                      ? 'rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100'
                      : 'rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:text-zinc-200'
                  }
                >
                  All Pokémon
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setObjectiveOnly(true);
                    setPage(1);
                  }}
                  className={
                    objectiveOnly
                      ? 'rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100'
                      : 'rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:text-zinc-200'
                  }
                >
                  Objective only
                </button>
              </div>
            </div>
          )}

          <PokedexFilters
            search={search}
            selectedType={
              selectedType
            }
            selectedGeneration={
              selectedGeneration
            }
            types={types}
            generations={
              generations
            }
            onSearchChange={(
              value,
            ) => {
              setSearch(value);
              setPage(1);
            }}
            onTypeChange={(
              value,
            ) => {
              setSelectedType(value);
              setPage(1);
            }}
            onGenerationChange={(
              value,
            ) => {
              setSelectedGeneration(
                value,
              );
              setPage(1);
            }}
          />

          
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
          <PokemonList
            pokemon={pokemon}
          />
        )}

        {!showLoader &&
          !error && (
            <Pagination
              page={page}
              totalPages={
                totalPages
              }
              onPageChange={
                setPage
              }
            />
          )}
      </div>
    </main>
  );
}