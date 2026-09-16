import {
  useState,
  type MouseEvent,
} from 'react';
import { Link } from 'react-router-dom';
import type { PokemonListItem } from '../types/pokemon';
import { useAuth } from '../auth/useAuth';
import { useCollection } from '../collection/useCollection';
import { useFavorites } from '../favorites/useFavorites';

interface PokemonCardProps {
  pokemon: PokemonListItem;
}

export function PokemonCard({
  pokemon,
}: PokemonCardProps) {
  const [imageLoaded, setImageLoaded] =
    useState(false);

  const [updatingFavorite, setUpdatingFavorite] =
    useState(false);

  const [updatingCollection, setUpdatingCollection] =
    useState(false);

  const { user } = useAuth();

  const {
    isCollected,
    toggleCollection,
  } = useCollection();

  const {
    isFavorite,
    toggleFavorite,
  } = useFavorites();

  const collected = isCollected(pokemon.id);
  const favorite = isFavorite(pokemon.id);

  async function handleFavoriteClick(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    setUpdatingFavorite(true);

    try {
      await toggleFavorite(pokemon.id);
    } finally {
      setUpdatingFavorite(false);
    }
  }

  async function handleCollectionClick(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    setUpdatingCollection(true);

    try {
      await toggleCollection(pokemon.id);
    } finally {
      setUpdatingCollection(false);
    }
  }

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      className="group relative flex min-h-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600 hover:bg-zinc-800"
    >
      <div className="relative flex w-2/5 items-center justify-center bg-zinc-950 p-4">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-zinc-900" />
        )}

        <img
          src={pokemon.image}
          alt={pokemon.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={`h-32 w-32 object-contain transition duration-300 group-hover:scale-105 ${
            imageLoaded
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />
      </div>

      <div className="relative flex flex-1 flex-col p-5 pr-14">
        {user && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) =>
                void handleCollectionClick(event)
              }
              disabled={updatingCollection}
              aria-label={
                collected
                  ? `Remove ${pokemon.name} from collection`
                  : `Add ${pokemon.name} to collection`
              }
              className={
                collected
                  ? 'flex h-9 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950/80 px-3 text-xs font-medium text-emerald-300 transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50'
                  : 'flex pb-1 h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-black/70 text-xl text-zinc-400 transition hover:border-emerald-700 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50'
              }
            >
              {updatingCollection
                ? '…'
                : collected
                  ? 'Captured'
                  : '+'}
            </button>

            <button
              type="button"
              onClick={(event) =>
                void handleFavoriteClick(event)
              }
              disabled={updatingFavorite}
              aria-label={
                favorite
                  ? `Remove ${pokemon.name} from favorites`
                  : `Add ${pokemon.name} to favorites`
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-black/70 text-xl transition hover:border-amber-500 hover:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={
                  favorite
                    ? 'text-amber-400 pb-0.5'
                    : 'text-zinc-500 pb-0.5'
                }
              >
                {favorite ? '★' : '☆'}
              </span>
            </button>
          </div>
        )}

        <div>
          <span className="text-sm text-zinc-500">
            #
            {pokemon.id
              .toString()
              .padStart(4, '0')}
          </span>

          <h2 className="mt-1 text-xl font-semibold text-zinc-100">
            {pokemon.name}
          </h2>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {pokemon.types.map((type) => (
            <span
              key={type}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-300"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}