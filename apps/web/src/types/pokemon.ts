export interface PokemonListItem {
    id: number;
    name: string;
    generation: number | null;
    image: string;
    types: string[];
}

export interface PokemonPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PokemonListResponse {
    items: PokemonListItem[];
    pagination: PokemonPagination;
}

export interface PokemonEvolutionSpecies {
  id: number;
  name: string;
  image: string;
}

export interface PokemonEvolutionConnection {
  from: number;
  to: number;
}

export interface PokemonEvolutionChain {
  pokemon: PokemonEvolutionSpecies[];
  connections: PokemonEvolutionConnection[];
}

export interface PokemonEvolutionRule {
  minLevel: number | null;
  minHappiness: number | null;
  minBeauty: number | null;
  minAffection: number | null;
  timeOfDay: string | null;
  gender: number | null;
  relativePhysicalStats: number | null;
  needsOverworldRain: boolean | null;
  turnUpsideDown: boolean | null;
  nearSpecialRock: boolean | null;
  needsMultiplayer: boolean | null;
  minMoveCount: number | null;
  minSteps: number | null;
  minDamageTaken: number | null;
  item: string | null;
  heldItem: string | null;
  knownType: string | null;
  location: string | null;
  partySpecies: {
    id: number;
    name: string;
  } | null;
  partyType: string | null;
  tradeSpecies: {
    id: number;
    name: string;
  } | null;
  region: string | null;
  baseForm: {
    id: number;
    name: string;
  } | null;
  evolvedForm: {
    id: number;
    name: string;
  } | null;
}

export interface PokemonNextEvolution {
  pokemon: PokemonEvolutionSpecies;
  trigger: string;
  rules: PokemonEvolutionRule[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  generation: {
    id: number;
    name: string;
  } | null;
  image: string;
  types: string[];
  abilities: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  } | null;
  evolutionChain: PokemonEvolutionChain | null;
  nextEvolutions: PokemonNextEvolution[];
}