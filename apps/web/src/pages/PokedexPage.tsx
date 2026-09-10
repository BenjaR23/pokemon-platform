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
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [types, setTypes] = useState<PokemonTypeOption[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [generations, setGenerations] = useState<PokemonGenerationOption[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState('');
  const [page, setPage] = useState(() => {
    const savedPage = Number(localStorage.getItem('pokedex-page'));

    return Number.isInteger(savedPage) && savedPage > 0
      ? savedPage
      : 1;
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    localStorage.setItem('pokedex-page', page.toString());
  }, [page]);

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
        if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
          setPage(data.pagination.totalPages);
        }
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
  const paginationItems = getPaginationItems(page, totalPages);

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
          <nav
            aria-label="Pokedex pagination"
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="First page"
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              «
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1}
              aria-label="Previous page"
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>

            {paginationItems.map((item) => {
              if (typeof item !== 'number') {
                return (
                  <span
                    key={item}
                    className="px-2 text-sm text-zinc-600"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = item === page;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  className={
                    isCurrentPage
                      ? 'cursor-default rounded-lg border border-zinc-500 bg-zinc-700 px-3 py-2 text-sm font-medium text-white'
                      : 'cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800'
                  }
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(totalPages, currentPage + 1),
                )
              }
              disabled={page === totalPages}
              aria-label="Next page"
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>

            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label="Last page"
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              »
            </button>
          </nav>
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

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 9) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];

  const firstPages = [1, 2];
  const lastPages = [totalPages - 1, totalPages];

  items.push(...firstPages);

  const middleStart = Math.max(3, currentPage - 2);
  const middleEnd = Math.min(totalPages - 2, currentPage + 2);

  if (middleStart > 3) {
    items.push('ellipsis-start');
  }

  for (let pageNumber = middleStart; pageNumber <= middleEnd; pageNumber++) {
    if (!items.includes(pageNumber)) {
      items.push(pageNumber);
    }
  }

  if (middleEnd < totalPages - 2) {
    items.push('ellipsis-end');
  }

  for (const pageNumber of lastPages) {
    if (!items.includes(pageNumber)) {
      items.push(pageNumber);
    }
  }

  return items;
}