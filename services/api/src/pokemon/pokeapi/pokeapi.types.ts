// Referencia generica de PokeAPI.
export interface PokeApiNamedResource {
  name: string;
  url: string;
}

export interface PokeApiPokemonSpecies {
  id: number;
  name: string;

  // Nombres localizados disponibles para la especie.
  // Por ahora se utilizara español y se mantendra ingles unicamente como fallback.
  names: Array<{
    name: string;
    language: PokeApiNamedResource;
  }>;

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
export interface PokeApiVersionGroup {
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

export interface PokeApiEvolutionChain {
  id: number;
  chain: PokeApiChainLink;
}

export interface PokeApiChainLink {
  species: PokeApiNamedResource;
  evolution_details: PokeApiEvolutionDetail[];
  evolves_to: PokeApiChainLink[];
}

export interface PokeApiEvolutionDetail {
  trigger: PokeApiNamedResource;

  item: PokeApiNamedResource | null;
  held_item: PokeApiNamedResource | null;
  known_move: PokeApiNamedResource | null;
  known_move_type: PokeApiNamedResource | null;
  used_move: PokeApiNamedResource | null;
  location: PokeApiNamedResource | null;
  party_species: PokeApiNamedResource | null;
  party_type: PokeApiNamedResource | null;
  trade_species: PokeApiNamedResource | null;

  version_group_id?: PokeApiNamedResource | null;
  region: PokeApiNamedResource | null;
  base_form: PokeApiNamedResource | null;
  evolved_form: PokeApiNamedResource | null;

  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  relative_physical_stats: number | null;
  min_move_count: number | null;
  min_steps: number | null;
  min_damage_taken: number | null;

  gender: number | null;

  is_default: boolean;
  near_special_rock: boolean;
  needs_multiplayer: boolean;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;

  time_of_day: string;
}

export interface PokeApiPokemonEncounter {
  location_area: PokeApiNamedResource;
  version_details: PokeApiEncounterVersionDetail[];
}

export interface PokeApiEncounterVersionDetail {
  version: PokeApiNamedResource;
  max_chance: number;
  encounter_details: PokeApiEncounterDetail[];
}

export interface PokeApiEncounterDetail {
  min_level: number;
  max_level: number;
  condition_values: PokeApiNamedResource[];
  chance: number;
  method: PokeApiNamedResource;
}

export interface PokeApiLocationArea {
  id: number;
  name: string;
  location: PokeApiNamedResource;
}

export interface PokeApiLocation {
  id: number;
  name: string;
  region: PokeApiNamedResource;
}

export interface PokeApiEncounterConditionValue {
  id: number;
  name: string;
  condition: PokeApiNamedResource;
}

export interface PokeApiVersion {
  id: number;
  name: string;
  version_group: PokeApiNamedResource;
}
