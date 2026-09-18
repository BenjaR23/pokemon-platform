import {
  useMemo,
  useState,
} from 'react';
import {Link} from 'react-router-dom';
import { useCollection } from '../collection/useCollection';
import type { CollectionEntry } from '../collection/collection.api';

export function CollectionPage() {
  return <CollectionContent />;
}

function CollectionContent() {
  const {
    collection,
    loading,
  } = useCollection();

  const [generation, setGeneration] =
    useState<number | 'all'>('all');

  const generations = useMemo(() => {
    const ids = collection
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
  }, [collection]);

  const filteredCollection = useMemo(() => {
    const filtered =
      generation === 'all'
        ? collection
        : collection.filter(
            (entry) =>
              entry.species.generation
                ?.externalId === generation,
          );

    return [...filtered].sort(
      (a, b) =>
        a.species.externalId -
        b.species.externalId,
    );
  }, [collection, generation]);

  if (loading) {
    return <CollectionSkeleton />;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              My Collection
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Pokémon captured:{' '}
              {filteredCollection.length}
            </p>
          </div>

          {collection.length > 0 && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="collection-generation-filter"
                className="text-sm text-zinc-400"
              >
                Generation
              </label>

              <select
                id="collection-generation-filter"
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

        {collection.length === 0 && (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <h2 className="text-lg font-medium text-zinc-200">
              Your collection is empty
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Explore the Pokédex and mark Pokémon as captured.
            </p>

            <Link
              to="/"
              className="mt-5 inline-block rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Browse Pokédex
            </Link>
          </div>
        )}

        {collection.length > 0 &&
          filteredCollection.length === 0 && (
            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
              <h2 className="text-lg font-medium text-zinc-200">
                No captured Pokémon in this generation
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Choose another generation or show all captured Pokémon.
              </p>
            </div>
          )}

        {filteredCollection.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCollection.map(
              (entry) => (
                <CollectionCard
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

interface CollectionCardProps {
  entry: CollectionEntry;
}

function CollectionCard({
  entry,
}: CollectionCardProps) {
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
            {pokemon.generation.externalId}
          </p>
        )}
      </div>
    </Link>
  );
}

function CollectionSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="h-9 w-48 animate-pulse rounded bg-zinc-900" />

        <div className="mt-3 h-4 w-32 animate-pulse rounded bg-zinc-900" />

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