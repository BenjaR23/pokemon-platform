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

/**
 * Contexto temporal de una ejecucion del pipeline.
 *
 * Los Map permiten recuperar directamente registros que ya
 * fueron sincronizados sin volver a consultar PokeAPI ni PostgreSQL.
 */
export interface PokemonSyncContext {
  generations: Map<number, SynchronizedGeneration>;
  versionGroups: Map<number, SynchronizedVersiongroup>;
}

// Cada ejecucion de syncRange obtiene un contexto independiente.
export function createPokemonSyncContext(): PokemonSyncContext {
  return {
    generations: new Map(),
    versionGroups: new Map(),
  };
}
