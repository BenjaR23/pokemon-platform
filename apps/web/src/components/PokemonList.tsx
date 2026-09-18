import type { PokemonListItem } from "../types/pokemon";
import { PokemonCard } from "./PokemonCard";
import type { RecommendationAssignment } from "../recommendations/recommendations.api";

interface PokemonListProps {
    pokemon: PokemonListItem[];

    recommendationByPokemon: Map<
        number,
        RecommendationAssignment
    >;
}

export function PokemonList({
    pokemon,
    recommendationByPokemon,
}: PokemonListProps) {
    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pokemon.map((item) => (
                <PokemonCard
                    key={item.id}
                    pokemon={item}
                    recommendation={
                        recommendationByPokemon.get(
                            item.id,
                        ) ?? null
                    }
                />
            ))}
        </div>
    )
}