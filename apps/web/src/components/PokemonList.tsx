import type { PokemonListItem } from "../types/pokemon";
import { PokemonCard } from "./PokemonCard";

interface PokemonListProps {
    pokemon: PokemonListItem[];
}

export function PokemonList({ pokemon }: PokemonListProps) {
    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pokemon.map((item) => (
                <PokemonCard
                    key={item.id}
                    pokemon={item}
                />
            ))}
        </div>
    )
}