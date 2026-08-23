// Referencia generica de PokeAPI.
export interface PokeApiNamedResource {
  name: string;
  url: string;
}

export interface PokeApiPokemonSpecies {
  id: number;
  name: string;

  evolution_chain: {
    url: string;
  } | null;

  generation: PokeApiNamedResource;

  varieties: Array<{
    is_default: boolean;
    pokemon: PokeApiNamedResource;
  }>;
}

// Respuesta minima del endpoint /pokemon/:id.
export interface PokeAPiPokemon {
  id: number;
  name: string;

  species: PokeApiNamedResource;
}
