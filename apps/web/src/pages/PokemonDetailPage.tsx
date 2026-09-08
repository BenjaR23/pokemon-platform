import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PokemonDetail } from '../types/pokemon';
import { PokemonEvolution } from '../components/PokemonEvolution';

export function PokemonDetailPage() {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPokemon() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3000/pokemon/${id}`);

        if (!response.ok) {
          throw new Error('Failed to load Pokemon');
        }

        const data: PokemonDetail = await response.json();

        setPokemon(data);
      } catch {
        setError('Could not load this Pokemon.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadPokemon();
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black p-8 text-zinc-400">
        Loading Pokemon...
      </main>
    );
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
          <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            <img
              src={pokemon.image}
              alt={pokemon.name}
              className="max-h-[420px] w-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-zinc-500">
              #{pokemon.id.toString().padStart(4, '0')}
            </span>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-100">
              {pokemon.name}
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
                    {ability}
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
          currentPokemonId={pokemon.id}
          evolutionChain={pokemon.evolutionChain}
          nextEvolutions={pokemon.nextEvolutions}
        />
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