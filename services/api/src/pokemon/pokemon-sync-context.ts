// Datos minimos de una generation persistida.
export interface SynchronizedGeneration {
  id: string;
  externalId: number;
  name: string;
}

// Datos minimos de un VersionGroup persistido.
export interface SynchronizedVersiongroup {
  id: string;
  externalId: number;
  name: string;
  generationId: string;
}

// Datos minimos de una Version obtenida desde PokeAPI.
export interface SynchronizedVersion {
  id: number;
  name: string;
  version_group: {
    name: string;
    url: string;
  };
}

// Datos minimos de una LocationArea persistida.
export interface SynchronizedLocationArea {
  id: string;
  externalId: number;
  name: string;
  locationId: string;
}

export interface SynchronizedEncounterConditionValue {
  id: string;
  externalId: number;
  name: string;
  conditionId: string;
}

/**
 * Contexto temporal de una ejecucion del pipeline.
 *
 * Los Map permiten recuperar directamente registros que ya
 * fueron sincronizados sin volver a consultar PokeAPI ni PostgreSQL.
 */
export interface PokemonSyncContext {
  generations: Map<number, SynchronizedGeneration>;
  versionGroups: Map<number, SynchronizedVersiongroup>;
  versions: Map<number, SynchronizedVersion>;
  locationAreas: Map<number, SynchronizedLocationArea>;
  encounterConditionValues: Map<number, SynchronizedEncounterConditionValue>;
}

// Cada ejecucion de syncRange obtiene un contexto independiente.
export function createPokemonSyncContext(): PokemonSyncContext {
  return {
    generations: new Map(),
    versionGroups: new Map(),
    versions: new Map(),
    locationAreas: new Map(),
    encounterConditionValues: new Map(),
  };
}
