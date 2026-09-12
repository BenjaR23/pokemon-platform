import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PokemonDetail, PokemonEncountersResponse } from '../types/pokemon';
import { PokemonEvolution } from '../components/PokemonEvolution';
import { PokemonEncounters } from '../components/PokemonEncounters';

export function PokemonDetailPage() {
  const { id, variantId } = useParams();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [encounterGames, setEncounterGames] = useState<PokemonEncountersResponse['games']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [id, variantId]);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(true);
        setError(null);

        const pokemonUrl = variantId
          ? `http://localhost:3000/pokemon/${id}/variants/${variantId}`
          : `http://localhost:3000/pokemon/${id}`;

        const encountersUrl = variantId
          ? `http://localhost:3000/pokemon/${id}/variants/${variantId}/encounters`
          : `http://localhost:3000/pokemon/${id}/encounters`;

        const [pokemonResponse, encountersResponse] = await Promise.all([
          fetch(pokemonUrl),
          fetch(encountersUrl),
        ]);

        if (!pokemonResponse.ok) {
          throw new Error('Failed to fetch Pokemon');
        }

        if (!encountersResponse.ok) {
          throw new Error('Failed to fecth Pokemon encounters');
        }

        const pokemonData: PokemonDetail = await pokemonResponse.json();

        const encountersData: PokemonEncountersResponse = await encountersResponse.json();

        setPokemon(pokemonData);
        setEncounterGames(encountersData.games);
      } catch {
        setError('Could not load Pokemon.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPokemon();
  }, [id, variantId]);

  if (isLoading) {
    return <PokemonDetailSkeleton />;
  }

  if (error || !pokemon) {
    return (
      <main className="min-h-screen bg-black p-8 text-zinc-400">
        {error ?? 'Pokemon not found.'}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Link
          to="/"
          className="text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          ← Back to Pokedex
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            {pokemon.variants.length > 1 && (
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {pokemon.variants.map((variant) => {
                  const isSelected = variant.id === pokemon.selectedVariant.id;

                  const path = variant.isDefault
                    ? `/pokemon/${pokemon.id}`
                    : `/pokemon/${pokemon.id}/variants/${variant.id}`;

                  return (
                    <Link
                      key={variant.id}
                      to={path}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        isSelected
                          ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      {formatName(variant.name)}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-center">
              <img
                src={pokemon.image}
                alt={formatName(pokemon.selectedVariant.name)}
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-zinc-500">
              #{pokemon.id.toString().padStart(4, '0')}
            </span>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-100">
              {formatName(pokemon.selectedVariant.name)}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-300"
                >
                  {type}
                </span>
              ))}
            </div>

            {pokemon.generation && (
              <p className="mt-6 text-sm text-zinc-400">
                Generation {pokemon.generation.id}
              </p>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-medium text-zinc-100">
                Abilities
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {pokemon.abilities.map((ability) => (
                  <span
                    key={ability}
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
                  >
                    {formatName(ability)}
                  </span>
                ))}
              </div>
            </div>

            {pokemon.stats && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-zinc-100">
                  Base Stats
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <Stat label="HP" value={pokemon.stats.hp} />
                  <Stat label="Attack" value={pokemon.stats.attack} />
                  <Stat label="Defense" value={pokemon.stats.defense} />
                  <Stat
                    label="Sp. Attack"
                    value={pokemon.stats.specialAttack}
                  />
                  <Stat
                    label="Sp. Defense"
                    value={pokemon.stats.specialDefense}
                  />
                  <Stat label="Speed" value={pokemon.stats.speed} />
                </div>
              </div>
            )}
          </div>
        </section>
        <PokemonEvolution
          currentPokemonNodeId={
            pokemon.selectedVariant.isDefault
              ? `${pokemon.id}:default`
              : `${pokemon.id}:${pokemon.selectedVariant.id}`
          }
          evolutionChain={pokemon.evolutionChain}
          nextEvolutions={pokemon.nextEvolutions}
        />

        <PokemonEncounters games={encounterGames} />
      </div>
    </main>
  );
}

interface StatProps {
  label: string;
  value: number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function PokemonDetailSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-900" />

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="h-72 w-72 animate-pulse rounded-2xl bg-zinc-900" />
          </div>

          <div className="flex flex-col">
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-900" />

            <div className="mt-3 h-10 w-52 animate-pulse rounded bg-zinc-900" />

            <div className="mt-4 flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-900" />
              <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-900" />
            </div>

            <div className="mt-6 h-4 w-28 animate-pulse rounded bg-zinc-900" />

            <div className="mt-8">
              <div className="h-6 w-24 animate-pulse rounded bg-zinc-900" />

              <div className="mt-3 flex gap-2">
                <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-900" />
                <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-900" />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-6 w-28 animate-pulse rounded bg-zinc-900" />

              <div className="mt-4 space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-zinc-900 pb-2"
                  >
                    <div className="h-4 w-24 animate-pulse rounded bg-zinc-900" />
                    <div className="h-4 w-10 animate-pulse rounded bg-zinc-900" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}