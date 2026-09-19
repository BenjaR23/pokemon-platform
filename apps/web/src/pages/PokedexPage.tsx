import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  getPokemon,
  getPokemonGenerations,
  getPokemonTypes,
} from '../api/pokemon.api';

import { Pagination } from '../components/Pagination';

import {
  PokedexFilters,
  type PokedexOrder,
} from '../components/PokedexFilters';

import { PokemonList } from '../components/PokemonList';
import { PokemonListLoader } from '../components/PokemonListLoader';

import { useProfile } from '../profiles/useProfile';

import {
  getRecommendationPokedex,
  getRecommendationPlan,
  type RecommendationAssignment,
} from '../recommendations/recommendations.api';

import type {
  PokemonGenerationOption,
  PokemonListItem,
  PokemonTypeOption,
} from '../types/pokemon';

export function PokedexPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    activeProfile,
  } = useProfile();

  const activeProfileId =
    activeProfile?.id ?? null;

  const objectiveMode =
    activeProfile?.objectiveMode ??
    null;

  const objectiveGenerationKey =
    activeProfile?.generations
      .map(
        (entry) =>
          entry.generation
            .externalId,
      )
      .join(',') ?? '';

  const page =
    parsePositiveInteger(
      searchParams.get('page'),
    ) ?? 1;

  const search =
    searchParams.get(
      'search',
    ) ?? '';

  const selectedType =
    searchParams.get(
      'type',
    ) ?? '';

  const selectedGeneration =
    searchParams.get(
      'generation',
    ) ?? '';

  const objectiveOnly =
    searchParams.get(
      'objectiveOnly',
    ) === 'true';

  const order =
    parseOrder(
      searchParams.get(
        'order',
      ),
    );

  const [
    pokemon,
    setPokemon,
  ] = useState<
    PokemonListItem[]
  >([]);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    search.trim(),
  );

  const [
    types,
    setTypes,
  ] = useState<
    PokemonTypeOption[]
  >([]);

  const [
    generations,
    setGenerations,
  ] = useState<
    PokemonGenerationOption[]
  >([]);

  const [
    recommendationAssignments,
    setRecommendationAssignments,
  ] = useState<
    RecommendationAssignment[]
  >([]);

  const objectiveGenerationIds =
    useMemo(() => {
      if (
        !objectiveOnly ||
        objectiveMode !==
          'GENERATIONS' ||
        !objectiveGenerationKey
      ) {
        return undefined;
      }

      return objectiveGenerationKey
        .split(',')
        .map(Number);
    }, [
      objectiveOnly,
      objectiveMode,
      objectiveGenerationKey,
    ]);

  const objectiveMinPokemonId =
    objectiveOnly &&
    objectiveMode ===
      'RANGE'
      ? activeProfile
          ?.startPokemonNumber ??
        undefined
      : undefined;

  const objectiveMaxPokemonId =
    objectiveOnly &&
    objectiveMode ===
      'RANGE'
      ? activeProfile
          ?.endPokemonNumber ??
        undefined
      : undefined;

  const recommendationOrderAvailable =
    activeProfileId !== null;

  const effectiveOrder:
    PokedexOrder =
    recommendationOrderAvailable
      ? order
      : 'POKEDEX';

  const recommendationByPokemon =
    useMemo(
      () =>
        new Map(
          recommendationAssignments.map(
            (assignment) => [
              assignment.pokemon
                .externalId,
              assignment,
            ],
          ),
        ),
      [
        recommendationAssignments,
      ],
    );

  useEffect(() => {
    const timeoutId =
      setTimeout(
        () => {
          setDebouncedSearch(
            search.trim(),
          );
        },
        300,
      );

    return () => {
      clearTimeout(
        timeoutId,
      );
    };
  }, [search]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [
          typesData,
          generationsData,
        ] =
          await Promise.all([
            getPokemonTypes(),
            getPokemonGenerations(),
          ]);

        setTypes(
          typesData,
        );

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
    async function fetchRecommendationPlan() {
      if (
        !activeProfileId
      ) {
        setRecommendationAssignments(
          [],
        );

        return;
      }

      try {
        const plan =
          await getRecommendationPlan(
            activeProfileId,
          );

        setRecommendationAssignments(
          plan.assignments,
        );
      } catch {
        setRecommendationAssignments(
          [],
        );
      }
    }

    void fetchRecommendationPlan();
  }, [activeProfileId]);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(
          true,
        );

        setError(
          null,
        );

        const params = {
          page,
          pageSize: 24,

          search:
            debouncedSearch ||
            undefined,

          type:
            selectedType ||
            undefined,

          generation:
            selectedGeneration
              ? Number(
                  selectedGeneration,
                )
              : undefined,

          generationIds:
            objectiveGenerationIds,

          minPokemonId:
            objectiveMinPokemonId,

          maxPokemonId:
            objectiveMaxPokemonId,
        };

        const data =
          effectiveOrder ===
            'RECOMMENDATION' &&
          activeProfileId
            ? await getRecommendationPokedex(
                activeProfileId,
                params,
              )
            : await getPokemon(
                params,
              );

        setPokemon(
          data.items,
        );

        setTotalPages(
          data.pagination
            .totalPages,
        );

        if (
          data.pagination
            .totalPages >
            0 &&
          page >
            data.pagination
              .totalPages
        ) {
          setSearchParams(
            (current) => {
              const next =
                new URLSearchParams(
                  current,
                );

              setPageParam(
                next,
                data.pagination
                  .totalPages,
              );

              return next;
            },
            {
              replace: true,
            },
          );
        }
      } catch {
        setError(
          'Could not load Pokemon.',
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    }

    void fetchPokemon();
  }, [
    page,
    debouncedSearch,
    selectedType,
    selectedGeneration,
    objectiveGenerationIds,
    objectiveMinPokemonId,
    objectiveMaxPokemonId,
    effectiveOrder,
    activeProfileId,
    setSearchParams,
  ]);

  function updateFilter(
    key: string,
    value: string | null,
  ) {
    setSearchParams(
      (current) => {
        const next =
          new URLSearchParams(
            current,
          );

        if (
          value === null ||
          value === ''
        ) {
          next.delete(key);
        } else {
          next.set(
            key,
            value,
          );
        }

        next.delete(
          'page',
        );

        return next;
      },
    );
  }

  function updatePage(
    newPage: number,
  ) {
    setSearchParams(
      (current) => {
        const next =
          new URLSearchParams(
            current,
          );

        setPageParam(
          next,
          newPage,
        );

        return next;
      },
    );
  }

  function updateObjectiveOnly(
    enabled: boolean,
  ) {
    updateFilter(
      'objectiveOnly',
      enabled
        ? 'true'
        : null,
    );
  }

  function updateOrder(
    value: PokedexOrder,
  ) {
    updateFilter(
      'order',
      value ===
        'RECOMMENDATION'
        ? 'recommendation'
        : null,
    );
  }

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
                  onClick={() =>
                    updateObjectiveOnly(
                      false,
                    )
                  }
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
                  onClick={() =>
                    updateObjectiveOnly(
                      true,
                    )
                  }
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
            search={
              search
            }
            selectedType={
              selectedType
            }
            selectedGeneration={
              selectedGeneration
            }
            order={
              effectiveOrder
            }
            recommendationOrderAvailable={
              recommendationOrderAvailable
            }
            types={
              types
            }
            generations={
              generations
            }
            onSearchChange={(
              value,
            ) =>
              updateFilter(
                'search',
                value,
              )
            }
            onTypeChange={(
              value,
            ) =>
              updateFilter(
                'type',
                value,
              )
            }
            onGenerationChange={(
              value,
            ) =>
              updateFilter(
                'generation',
                value,
              )
            }
            onOrderChange={
              updateOrder
            }
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
        ) : pokemon.length ===
          0 ? (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 py-16 text-center">
            <p className="text-zinc-400">
              No Pokemon found.
            </p>
          </div>
        ) : (
          <PokemonList
            pokemon={
              pokemon
            }
            recommendationByPokemon={
              recommendationByPokemon
            }
          />
        )}

        {!showLoader &&
          !error && (
          <Pagination
            page={
              page
            }
            totalPages={
              totalPages
            }
            onPageChange={
              updatePage
            }
          />
        )}
      </div>
    </main>
  );
}

function parsePositiveInteger(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    return null;
  }

  return parsed;
}

function parseOrder(
  value: string | null,
): PokedexOrder {
  return value ===
    'recommendation'
    ? 'RECOMMENDATION'
    : 'POKEDEX';
}

function setPageParam(
  params: URLSearchParams,
  page: number,
) {
  if (page <= 1) {
    params.delete(
      'page',
    );

    return;
  }

  params.set(
    'page',
    page.toString(),
  );
}