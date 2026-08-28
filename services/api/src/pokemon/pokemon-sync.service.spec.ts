import { PokemonSyncService } from './pokemon-sync.service.js';
import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PokemonSyncService', () => {
  let service: PokemonSyncService;

  // Pokemon Service se simula porque este test solo comprueba la orquestacion del proceso.
  const pokemonServiceMock = {
    syncSpecies: jest.fn(),
  };

  const prismaMock = {
    syncRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new PokemonSyncService(
      pokemonServiceMock as unknown as PokemonService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('should synchronize an inclusive range of Pokemon species', async () => {
    // Simulamos el registro inicial de la ejecucion.
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'running',
    });

    // No se necesita un resultado concreto de cada especie.
    pokemonServiceMock.syncSpecies.mockResolvedValue({});

    // Se simula el registro final exitoso.
    prismaMock.syncRun.update.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'completed',
    });

    await service.syncRange(1, 3);

    // El rango debe ser inclusivo.
    expect(pokemonServiceMock.syncSpecies).toHaveBeenCalledTimes(3);

    // Se verifica que las tres llamdas reciban algun contexto.
    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      1,
      1,
      expect.any(Object),
    );

    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      2,
      2,
      expect.any(Object),
    );

    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      3,
      3,
      expect.any(Object),
    );

    // La ejecucion debe comenzar en estado running.
    expect(prismaMock.syncRun.create).toHaveBeenCalledWith({
      data: {
        source: 'pokeapi',
        status: 'running',
      },
    });

    // Y finalmente debe quedar completada.
    expect(prismaMock.syncRun.update).toHaveBeenCalledWith({
      where: {
        id: 'sync-run-uuid',
      },
      data: {
        status: 'completed',
        finishedAt: expect.any(Date) as Date,
      },
    });
  });

  it('should mark the sync run as failed when a species cannot be synchronized', async () => {
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'running',
    });

    // La primera especie funciona.
    pokemonServiceMock.syncSpecies
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('PokeAPI failure'));

    prismaMock.syncRun.update.mockResolvedValue({});

    await expect(service.syncRange(1, 3)).rejects.toThrow.apply(
      'PokeAPI failure',
    );

    // Solo deberian haberse intentado 1 y 2.
    // La especie 3 no se ejecuta despues del error.
    expect(pokemonServiceMock.syncSpecies).toHaveBeenCalledTimes(2);

    expect(prismaMock.syncRun.update).toHaveBeenCalledWith({
      where: {
        id: 'sync-run-uuid',
      },
      data: {
        status: 'failed',
        finishedAt: expect.any(Date) as Date,
        error: 'PokeAPI failure',
      },
    });
  });

  it('should reject an invalid synchronization range', async () => {
    await expect(service.syncRange(10, 5)).rejects.toThrow(
      'Invalid Pokemon synchronization range',
    );

    // Si el rango es invalido no debe crearse ningun SyncRun.
    expect(prismaMock.syncRun.create).not.toHaveBeenCalled();

    expect(pokemonServiceMock.syncSpecies).not.toHaveBeenCalled();
  });
});
