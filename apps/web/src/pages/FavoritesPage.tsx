import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../favorites/useFavorites';
import type { FavoriteEntry } from '../favorites/favorites.api';

export function FavoritesPage() {
  return <FavoritesContent />;
}

function FavoritesContent() {
  const {
    favorites,
    loading,
  } = useFavorites();

  const [generation, setGeneration] =
    useState<number | 'all'>('all');

  const generations = useMemo(() => {
    const ids = favorites
      .map(
        (entry) =>
          entry.species.generation?.externalId,
      )
      .filter(
        (id): id is number =>
          id !== undefined,
      );

    return Array.from(new Set(ids)).sort(
      (a, b) => a - b,
    );
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    const filtered =
      generation === 'all'
        ? favorites
        : favorites.filter(
            (entry) =>
              entry.species.generation
                ?.externalId === generation,
          );

    return [...filtered].sort(
      (a, b) =>
        a.species.externalId -
        b.species.externalId,
    );
  }, [favorites, generation]);

  if (loading) {
    return <FavoritesSkeleton />;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              Favorites
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Pokémon in favorites:{' '}
              {filteredFavorites.length}
            </p>
          </div>

          {favorites.length > 0 && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="generation-filter"
                className="text-sm text-zinc-400"
              >
                Generation
              </label>

              <select
                id="generation-filter"
                value={generation}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setGeneration(
                    value === 'all'
                      ? 'all'
                      : Number(value),
                  );
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
              >
                <option value="all">
                  All
                </option>

                {generations.map(
                  (generationId) => (
                    <option
                      key={generationId}
                      value={generationId}
                    >
                      Generation {generationId}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}
        </div>

        {favorites.length === 0 && (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <h2 className="text-lg font-medium text-zinc-200">
              You have no favorites yet
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Use the star on a Pokémon card or
              add favorites from its detail page.
            </p>

            <Link
              to="/"
              className="mt-5 inline-block rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Browse Pokédex
            </Link>
          </div>
        )}

        {favorites.length > 0 &&
          filteredFavorites.length === 0 && (
            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
              <h2 className="text-lg font-medium text-zinc-200">
                No favorites in this generation
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Choose another generation or
                show all favorites.
              </p>
            </div>
          )}

        {filteredFavorites.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFavorites.map(
              (entry) => (
                <FavoriteCard
                  key={entry.id}
                  entry={entry}
                />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

interface FavoriteCardProps {
  entry: FavoriteEntry;
}

function FavoriteCard({
  entry,
}: FavoriteCardProps) {
  const pokemon = entry.species;

  const defaultVariety =
    pokemon.varieties[0];

  const image = defaultVariety
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${defaultVariety.externalId}.png`
    : null;

  return (
    <Link
      to={`/pokemon/${pokemon.externalId}`}
      className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600 hover:bg-zinc-900"
    >
      <div className="flex aspect-square items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={formatName(pokemon.name)}
            className="max-h-full max-w-full object-contain transition group-hover:scale-105"
          />
        ) : (
          <div className="text-sm text-zinc-600">
            No image
          </div>
        )}
      </div>

      <div className="mt-4">
        <span className="text-xs text-zinc-500">
          #
          {pokemon.externalId
            .toString()
            .padStart(4, '0')}
        </span>

        <h2 className="mt-1 text-lg font-medium text-zinc-100">
          {formatName(pokemon.name)}
        </h2>

        {pokemon.generation && (
          <p className="mt-1 text-sm text-zinc-500">
            Generation{' '}
            {
              pokemon.generation
                .externalId
            }
          </p>
        )}
      </div>
    </Link>
  );
}

function FavoritesSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="h-9 w-40 animate-pulse rounded bg-zinc-900" />

        <div className="mt-3 h-4 w-36 animate-pulse rounded bg-zinc-900" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
            >
              <div className="aspect-square animate-pulse rounded-xl bg-zinc-900" />

              <div className="mt-4 h-3 w-16 animate-pulse rounded bg-zinc-900" />

              <div className="mt-3 h-6 w-28 animate-pulse rounded bg-zinc-900" />

              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function formatName(name: string) {
  return name
    .split('-')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}