import { ReferenceDataService } from './reference-data.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createPokemonSyncContext } from './pokemon-sync-context.js';

describe('ReferenceDataService', () => {
  let service: ReferenceDataService;

  // Mock del cliente de PokeAPI.
  // En este test solo necesitamos los endpoints relacionados
  // con Generation, VersionGroup y Version.
  const pokeApiClientMock = {
    getGeneration: jest.fn(),
    getVersionGroup: jest.fn(),
    getVersion: jest.fn(),
  };

  // Mock de Prisma.
  // Solo incluimos los modelos utilizados por ReferenceDataService.
  const prismaMock = {
    generation: {
      upsert: jest.fn(),
    },
    versionGroup: {
      upsert: jest.fn(),
    },
    game: {
      upsert: jest.fn(),
    },
  };

  beforeEach(() => {
    // Cada test debe comenzar sin llamadas ni valores
    // configurados por pruebas anteriores.
    jest.resetAllMocks();

    // Se crea el servicio con dependencias simuladas.
    service = new ReferenceDataService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
    );
  });

  it('should synchronize a generation with its version groups and games', async () => {
    // PokeAPI indica que Generation I contiene el grupo red-blue.
    pokeApiClientMock.getGeneration.mockResolvedValue({
      id: 1,
      name: 'generation-i',
      version_groups: [
        {
          name: 'red-blue',
          url: 'https://pokeapi.co/api/v2/version-group/1/',
        },
      ],
    });

    // El grupo red-blue contiene los juegos red y blue.
    pokeApiClientMock.getVersionGroup.mockResolvedValue({
      id: 1,
      name: 'red-blue',
      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },
      versions: [
        {
          name: 'red',
          url: 'https://pokeapi.co/api/v2/version/1/',
        },
        {
          name: 'blue',
          url: 'https://pokeapi.co/api/v2/version/2/',
        },
      ],
    });

    // Primera llamada a /version/:id -> Red.
    // Segunda llamada -> Blue.
    pokeApiClientMock.getVersion
      .mockResolvedValueOnce({
        id: 1,
        name: 'red',
        version_group: {
          name: 'red-blue',
          url: 'https://pokeapi.co/api/v2/version-group/1/',
        },
      })
      .mockResolvedValueOnce({
        id: 2,
        name: 'blue',
        version_group: {
          name: 'red-blue',
          url: 'https://pokeapi.co/api/v2/version-group/1/',
        },
      });

    // Generation persistida en PostgreSQL.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // VersionGroup persistido y relacionado con Generation.
    prismaMock.versionGroup.upsert.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    // El valor devuelto por Game no se utiliza posteriormente.
    prismaMock.game.upsert.mockResolvedValue({});

    // Ejecutamos la sincronización.
    const result = await service.syncGeneration(1);

    // Se debe consultar la generación solicitada.
    expect(pokeApiClientMock.getGeneration).toHaveBeenCalledWith(1);

    // Generation debe persistirse mediante externalId.
    expect(prismaMock.generation.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'generation-i',
      },
      create: {
        externalId: 1,
        name: 'generation-i',
      },
    });

    // El ID del VersionGroup debe extraerse desde su URL.
    expect(pokeApiClientMock.getVersionGroup).toHaveBeenCalledWith(1);

    // VersionGroup debe quedar vinculado al UUID de Generation.
    expect(prismaMock.versionGroup.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'red-blue',
        generationId: 'generation-uuid',
      },
      create: {
        externalId: 1,
        name: 'red-blue',
        generationId: 'generation-uuid',
      },
    });

    // Deben consultarse los dos juegos.
    expect(pokeApiClientMock.getVersion).toHaveBeenCalledTimes(2);
    expect(pokeApiClientMock.getVersion).toHaveBeenNthCalledWith(1, 1);
    expect(pokeApiClientMock.getVersion).toHaveBeenNthCalledWith(2, 2);

    // Red debe persistirse dentro de red-blue.
    expect(prismaMock.game.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'red',
        versionGroupId: 'version-group-uuid',
      },
      create: {
        externalId: 1,
        name: 'red',
        versionGroupId: 'version-group-uuid',
      },
    });

    // Blue también debe persistirse dentro del mismo VersionGroup.
    expect(prismaMock.game.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 2,
      },
      update: {
        name: 'blue',
        versionGroupId: 'version-group-uuid',
      },
      create: {
        externalId: 2,
        name: 'blue',
        versionGroupId: 'version-group-uuid',
      },
    });

    // syncGeneration debe devolver Generation porque
    // PokemonService necesita su UUID interno.
    expect(result).toEqual({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });
  });

  it('should reuse a generation synchronized in the same sync context', async () => {
    // Se crea un contexto compartido para simular una unica ejecucion de sincronizacion por rango.
    const syncContext = createPokemonSyncContext();

    /**
     * PokeAPI devuelve una generacion sin VersionGroups.
     * Para este test solamente interesa comprobar
     * el comportamiento del cache de Generation.
     */
    pokeApiClientMock.getGeneration.mockResolvedValue({
      id: 1,
      name: 'generation-i',
      version_groups: [],
    });

    // Prisma devuelve la Generation persistida.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // Primera llamada: debe sincronizar normalmente.
    const firstResult = await service.syncGeneration(1, syncContext);

    // Segunda llamada dentro del mismo contexto:
    // debe reutilizar el resultado anterior.
    const secondResult = await service.syncGeneration(1, syncContext);

    // PokeAPI solamente debe consultarse una vez.
    expect(prismaMock.generation.upsert).toHaveBeenCalledTimes(1);

    // El upsert tambien solamente debe ejecutarse una vez.
    expect(prismaMock.generation.upsert).toHaveBeenCalledTimes(1);

    // Ambas llamadas deben devolver la misma Generation.
    expect(firstResult).toEqual({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    expect(secondResult).toEqual(firstResult);
  });

  it('should reuse a version group synchronized in the same sync context', async () => {
    // Se crea un contexto compartido para representar una unica ejecucion del pipeline.
    const syncContext = createPokemonSyncContext();

    /**
     * Se simula un VersionGroup sin juegos.
     * Para este test solamente interesa comprobar
     * el comportamiento del cache.
     */
    pokeApiClientMock.getVersionGroup.mockResolvedValue({
      id: 1,
      name: 'red-blue',
      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },
      versions: [],
    });

    // Se simula que Generation ya es conocida, por lo que synVeriongroup no necesita resolverla.
    prismaMock.versionGroup.upsert.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    // Primera llamada: sincroniza normalmente.
    const firstResult = await service.syncVersionGroup(
      1,
      'generation-uuid',
      syncContext,
    );

    // Segunda llamada con el mismo contexto:
    // debe reutilizar el VersionGroup anterior.
    const secondResult = await service.syncVersionGroup(
      1,
      'generation-uuid',
      syncContext,
    );

    // PokeAPI solamente debe consultarse una vez.
    expect(pokeApiClientMock.getVersionGroup).toHaveBeenCalledTimes(1);

    // Prisma tampoco debe ejecutar nuevamente el upsert.
    expect(prismaMock.versionGroup.upsert).toHaveBeenCalledTimes(1);

    // Ambas llamadas deben devolver el mismo resultado.
    expect(firstResult).toEqual({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    expect(secondResult).toEqual(firstResult);
  });
});
