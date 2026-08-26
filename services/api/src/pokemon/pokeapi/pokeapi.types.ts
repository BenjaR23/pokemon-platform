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

  forms: PokeApiNamedResource[];

  types: Array<{
    slot: number;
    type: PokeApiNamedResource;
  }>;

  abilities: Array<{
    is_hidden: boolean;
    slot: number;
    ability: PokeApiNamedResource;
  }>;

  stats: Array<{
    base_stat: number;
    effort: number;
    stat: PokeApiNamedResource;
  }>;
}

export interface PokeApiPokemonForm {
  id: number;
  name: string;
  form_name: string;
  is_default: boolean;
  is_battle_only: boolean;

  pokemon: PokeApiNamedResource;

  version_group: PokeApiNamedResource | null;
}

// Representa la informacion minima que se necesita del endpoint /generation/:id.
export interface PokeApiGeneration {
  id: number;
  name: string;

  // Grupos de versiones asociados a esta generacion.
  version_groups: PokeApiNamedResource[];
}

// Representa la informacion minima necesaria del endpoint /version-group/:id.
export interface PokeAPiVersionGroup {
  id: number;
  name: string;

  // Generacion a la que pertenece el grupo de versiones.
  generation: PokeApiNamedResource;

  // Versiones/juegos concretos incluidos en este grupo.
  versions: PokeApiNamedResource[];
}

// Representa la informacion minima del endpoint /version/:id.
export interface PokeApiVersion {
  id: number;
  name: string;

  // Grupo de versiones al que pertenece el juego.
  version_group: PokeApiNamedResource;
}
