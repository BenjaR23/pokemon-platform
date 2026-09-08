import type { PokemonListItem } from "../types/pokemon";

interface PokemonCardProps {
    pokemon: PokemonListItem;
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
    return (
        <a
            href={`/pokemon/${pokemon.id}`}
            className="group flex min-h-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
            <div className="flex w-2/5 items-center justify-center bg-zinc-950 p-4">
                <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="h-32 w-32 object-contain transition-transform duration-200 group-hover:scale-105"
                />
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div>
                    <span className="text-sm text-zinc-500">
                        #{pokemon.id.toString().padStart(4, '0')}
                    </span>

                    <h2 className="mt-1 test-xl font-semibold text-zinc-100">
                        {pokemon.name}
                    </h2>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {pokemon.types.map((type) => (
                        <span
                            key={type}
                            className="rounded-md border border-zinc-700 bg.zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-300"
                        >
                            {type}
                        </span>
                    ))}
                </div>
            </div>
        </a>
    )
}