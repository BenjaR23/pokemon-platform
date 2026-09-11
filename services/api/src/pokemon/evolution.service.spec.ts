import { EvolutionService } from './evolution.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferenceDataService } from './reference-data.service.js';

describe('EvolutionService', () => {
  let service: EvolutionService;

  const referenceDataServiceMock = {
    syncVersionGroup: jest.fn(),
  };

  const pokeApiClientMock = {
    getEvolutionChain: jest.fn(),
  };

  const prismaMock = {
    evolutionChain: {
      upsert: jest.fn(),
    },
    pokemonSpecies: {
      findUnique: jest.fn(),
    },
    evolutionTrigger: {
      upsert: jest.fn(),
    },
    evolution: {
      upsert: jest.fn(),
    },
    item: {
      upsert: jest.fn(),
    },
    move: {
      upsert: jest.fn(),
    },
    type: {
      upsert: jest.fn(),
    },
    region: {
      upsert: jest.fn(),
    },
    location: {
      findUnique: jest.fn(),
    },
    pokemonVariety: {
      findUnique: jest.fn(),
    },
    evolutionRule: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const createEvolutionDetail = (overrides: Record<string, unknown> = {}) => ({
    trigger: {
      name: 'level-up',
      url: 'https://pokeapi.co/api/v2/evolution-trigger/1/',
    },

    item: null,
    held_item: null,
    known_move: null,
    known_move_type: null,
    location: null,
    party_species: null,
    party_type: null,
    trade_species: null,

    version_group_id: null,
    region: null,
    base_form: null,
    evolved_form: null,
    used_move: null,

    min_level: null,
    min_happiness: null,
    min_beauty: null,
    min_affection: null,

    gender: null,
    relative_physical_stats: null,

    needs_overworld_rain: false,
    turn_upside_down: false,
    near_special_rock: false,
    needs_multiplayer: false,

    min_move_count: null,
    min_steps: null,
    min_damage_taken: null,

    time_of_day: '',
    is_default: undefined,

    ...overrides,
  });

  const mockEvolutionTransition = ({
    fromExternalId,
    toExternalId,
    fromSpeciesId,
    toSpeciesId,
    triggerId = 'trigger-uuid',
    evolutionId = 'evolution-uuid',
  }: {
    fromExternalId: number;
    toExternalId: number;
    fromSpeciesId: string;
    toSpeciesId: string;
    triggerId?: string;
    evolutionId?: string;
  }) => {
    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: fromSpeciesId,
        externalId: fromExternalId,
      })
      .mockResolvedValueOnce({
        id: toSpeciesId,
        externalId: toExternalId,
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: triggerId,
    });

    prismaMock.evolution.upsert.mockResolvedValue({
      id: evolutionId,
    });
  };

  const mockEvolutionChain = (
    externalId: number,
    id = 'evolution-chain-uuid',
  ) => {
    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id,
      externalId,
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new EvolutionService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
      referenceDataServiceMock as unknown as ReferenceDataService,
    );
  });

  it('should synchronize an evolution chain', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 1,
      chain: {
        species: {
          name: 'bulbasaur',
          url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'ivysaur',
              url: 'https://pokeapi.co/api/v2/pokemon-species/2/',
            },
            evolution_details: [
              createEvolutionDetail({
                min_level: 16,
              }),
            ],
            evolves_to: [
              {
                species: {
                  name: 'venusaur',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/3/',
                },
                evolution_details: [
                  createEvolutionDetail({
                    min_level: 32,
                  }),
                ],
                evolves_to: [],
              },
            ],
          },
        ],
      },
    });

    mockEvolutionChain(1);

    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'bulbasaur-uuid',
        externalId: 1,
        name: 'bulbasaur',
      })
      .mockResolvedValueOnce({
        id: 'ivysaur-uuid',
        externalId: 2,
        name: 'ivysaur',
      })
      .mockResolvedValueOnce({
        id: 'ivysaur-uuid',
        externalId: 2,
        name: 'ivysaur',
      })
      .mockResolvedValueOnce({
        id: 'venusaur-uuid',
        externalId: 3,
        name: 'venusaur',
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: 'level-up-trigger-uuid',
      externalId: 1,
      name: 'level-up',
    });

    prismaMock.evolution.upsert
      .mockResolvedValueOnce({
        id: 'bulbasaur-ivysaur-evolution-uuid',
      })
      .mockResolvedValueOnce({
        id: 'ivysaur-venusaur-evolution-uuid',
      });

    const result = await service.syncEvolutionChain(1);

    expect(pokeApiClientMock.getEvolutionChain).toHaveBeenCalledWith(1);

    expect(prismaMock.evolutionChain.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {},
      create: {
        externalId: 1,
      },
    });

    expect(result).toEqual({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    expect(prismaMock.evolutionTrigger.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'level-up',
      },
      create: {
        externalId: 1,
        name: 'level-up',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'bulbasaur-ivysaur-evolution-uuid',

        minLevel: 16,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'ivysaur-venusaur-evolution-uuid',

        minLevel: 32,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledTimes(2);

    expect(prismaMock.item.upsert).not.toHaveBeenCalled();

    expect(prismaMock.evolution.upsert).toHaveBeenCalledTimes(2);

    expect(prismaMock.evolution.upsert).toHaveBeenCalledWith({
      where: {
        chainId_fromSpeciesId_toSpeciesId_triggerId: {
          chainId: 'evolution-chain-uuid',
          fromSpeciesId: 'bulbasaur-uuid',
          toSpeciesId: 'ivysaur-uuid',
          triggerId: 'level-up-trigger-uuid',
        },
      },
      update: {},
      create: {
        chainId: 'evolution-chain-uuid',
        fromSpeciesId: 'bulbasaur-uuid',
        toSpeciesId: 'ivysaur-uuid',
        triggerId: 'level-up-trigger-uuid',
      },
    });

    expect(prismaMock.evolution.upsert).toHaveBeenCalledWith({
      where: {
        chainId_fromSpeciesId_toSpeciesId_triggerId: {
          chainId: 'evolution-chain-uuid',
          fromSpeciesId: 'ivysaur-uuid',
          toSpeciesId: 'venusaur-uuid',
          triggerId: 'level-up-trigger-uuid',
        },
      },
      update: {},
      create: {
        chainId: 'evolution-chain-uuid',
        fromSpeciesId: 'ivysaur-uuid',
        toSpeciesId: 'venusaur-uuid',
        triggerId: 'level-up-trigger-uuid',
      },
    });
  });

  it('should synchronize an evolution rule that requires an item', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 10,
      chain: {
        species: {
          name: 'pikachu',
          url: 'https://pokeapi.co/api/v2/pokemon-species/25/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'raichu',
              url: 'https://pokeapi.co/api/v2/pokemon-species/26/',
            },
            evolution_details: [
              createEvolutionDetail({
                trigger: {
                  name: 'use-item',
                  url: 'https://pokeapi.co/api/v2/evolution-trigger/3/',
                },
                item: {
                  name: 'thunder-stone',
                  url: 'https://pokeapi.co/api/v2/item/83/',
                },
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(10);

    mockEvolutionTransition({
      fromExternalId: 25,
      toExternalId: 26,
      fromSpeciesId: 'pikachu-uuid',
      toSpeciesId: 'raichu-uuid',
      evolutionId: 'pikachu-raichu-evolution-uuid',
    });

    prismaMock.item.upsert.mockResolvedValue({
      id: 'thunder-stone-uuid',
      externalId: 83,
      name: 'thunder-stone',
    });

    await service.syncEvolutionChain(10);

    expect(prismaMock.item.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 83,
      },
      update: {
        name: 'thunder-stone',
      },
      create: {
        externalId: 83,
        name: 'thunder-stone',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'pikachu-raichu-evolution-uuid',
        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,
        itemId: 'thunder-stone-uuid',
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should skip an evolution transition when a species is not synchronized yet', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 1,
      chain: {
        species: {
          name: 'bulbasaur',
          url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'ivysaur',
              url: 'https://pokeapi.co/api/v2/pokemon-species/2/',
            },
            evolution_details: [
              createEvolutionDetail({
                min_level: 16,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(1);

    // Bulbasaur ya existe, pero Ivysaur todavia no.
    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'bulbasaur-uuid',
        externalId: 1,
        name: 'bulbasaur',
      })
      .mockResolvedValueOnce(null);

    await service.syncEvolutionChain(1);

    // No se puede crear la evolucion hasta que ambas especies existan.
    expect(prismaMock.evolutionTrigger.upsert).not.toHaveBeenCalled();

    expect(prismaMock.evolution.upsert).not.toHaveBeenCalled();

    expect(prismaMock.evolutionRule.create).not.toHaveBeenCalled();
  });

  it('should preserve multiple evolution details that share the same trigger', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 1,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/2/',
            },
            evolution_details: [
              createEvolutionDetail({
                min_level: 20,
              }),
              createEvolutionDetail({
                min_happiness: 160,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(1);

    mockEvolutionTransition({
      fromExternalId: 1,
      toExternalId: 2,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    await service.syncEvolutionChain(1);

    expect(prismaMock.evolutionTrigger.upsert).toHaveBeenCalledTimes(1);

    expect(prismaMock.evolution.upsert).toHaveBeenCalledTimes(1);

    expect(prismaMock.evolutionRule.deleteMany).toHaveBeenCalledTimes(1);

    expect(prismaMock.evolutionRule.deleteMany).toHaveBeenCalledWith({
      where: {
        evolutionId: 'evolution-uuid',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledTimes(2);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',
        minLevel: 20,

        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: 160,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize special scalar evolution conditions', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 100,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/100/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/101/',
            },
            evolution_details: [
              createEvolutionDetail({
                min_level: 30,
                gender: 2,
                relative_physical_stats: 1,
                needs_overworld_rain: true,
                turn_upside_down: true,
                near_special_rock: true,
                needs_multiplayer: true,
                min_move_count: 5,
                min_steps: 1000,
                min_damage_taken: 20,
                time_of_day: 'night',
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(100);

    mockEvolutionTransition({
      fromExternalId: 100,
      toExternalId: 101,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    await service.syncEvolutionChain(100);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledTimes(1);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: 30,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: 2,
        relativePhysicalStats: 1,

        minMoveCount: 5,
        minSteps: 1000,
        minDamageTaken: 20,

        needsOverworldRain: true,
        turnUpsideDown: true,
        nearSpecialRock: true,
        needsMultiplayer: true,

        isDefault: null,

        timeOfDay: 'night',

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize an evolution rule that requires a held item', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 200,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/200/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/201/',
            },
            evolution_details: [
              createEvolutionDetail({
                held_item: {
                  name: 'razor-claw',
                  url: 'https://pokeapi.co/api/v2/item/303/',
                },
                time_of_day: 'night',
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(200);

    mockEvolutionTransition({
      fromExternalId: 200,
      toExternalId: 201,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.item.upsert.mockResolvedValue({
      id: 'razor-claw-uuid',
      externalId: 303,
      name: 'razor-claw',
    });

    await service.syncEvolutionChain(200);

    expect(prismaMock.item.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 303,
      },
      update: {
        name: 'razor-claw',
      },
      create: {
        externalId: 303,
        name: 'razor-claw',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: 'night',

        itemId: null,
        heldItemId: 'razor-claw-uuid',

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,

        versionGroupId: null,

        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize known move type and party type evolution conditions', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 300,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/300/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/301/',
            },
            evolution_details: [
              createEvolutionDetail({
                known_move_type: {
                  name: 'dark',
                  url: 'https://pokeapi.co/api/v2/type/17/',
                },
                party_type: {
                  name: 'fairy',
                  url: 'https://pokeapi.co/api/v2/type/18/',
                },
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(300);

    mockEvolutionTransition({
      fromExternalId: 300,
      toExternalId: 301,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.type.upsert
      .mockResolvedValueOnce({
        id: 'dark-type-uuid',
        externalId: 17,
        name: 'dark',
      })
      .mockResolvedValueOnce({
        id: 'fairy-type-uuid',
        externalId: 18,
        name: 'fairy',
      });

    await service.syncEvolutionChain(300);

    expect(prismaMock.type.upsert).toHaveBeenCalledTimes(2);

    expect(prismaMock.type.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 17,
      },
      update: {
        name: 'dark',
      },
      create: {
        externalId: 17,
        name: 'dark',
      },
    });

    expect(prismaMock.type.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 18,
      },
      update: {
        name: 'fairy',
      },
      create: {
        externalId: 18,
        name: 'fairy',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: 'dark-type-uuid',
        partyTypeId: 'fairy-type-uuid',

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize party species and trade species evolution conditions', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 400,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/400/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/401/',
            },
            evolution_details: [
              createEvolutionDetail({
                party_species: {
                  name: 'mantyke',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/458/',
                },
                trade_species: {
                  name: 'karrablast',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/588/',
                },
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(400);

    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'species-one-uuid',
        externalId: 400,
        name: 'species-one',
      })
      .mockResolvedValueOnce({
        id: 'species-two-uuid',
        externalId: 401,
        name: 'species-two',
      })
      .mockResolvedValueOnce({
        id: 'mantyke-uuid',
        externalId: 458,
        name: 'mantyke',
      })
      .mockResolvedValueOnce({
        id: 'karrablast-uuid',
        externalId: 588,
        name: 'karrablast',
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: 'level-up-trigger-uuid',
      externalId: 1,
      name: 'level-up',
    });

    prismaMock.evolution.upsert.mockResolvedValue({
      id: 'evolution-uuid',
    });

    await service.syncEvolutionChain(400);

    expect(prismaMock.pokemonSpecies.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 458,
      },
    });

    expect(prismaMock.pokemonSpecies.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 588,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: 'mantyke-uuid',
        tradeSpeciesId: 'karrablast-uuid',

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize a region evolution condition', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 500,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/500/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/501/',
            },
            evolution_details: [
              createEvolutionDetail({
                region: {
                  name: 'alola',
                  url: 'https://pokeapi.co/api/v2/region/7/',
                },
                is_default: true,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(500);

    mockEvolutionTransition({
      fromExternalId: 500,
      toExternalId: 501,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'alola-region-uuid',
      externalId: 7,
      name: 'alola',
    });

    await service.syncEvolutionChain(500);

    expect(prismaMock.region.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 7,
      },
      update: {
        name: 'alola',
      },
      create: {
        externalId: 7,
        name: 'alola',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: true,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: 'alola-region-uuid',
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize a version group evolution condition', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 600,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/600/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/601/',
            },
            evolution_details: [
              createEvolutionDetail({
                version_group_id: {
                  name: 'sword-shield',
                  url: 'https://pokeapi.co/api/v2/version-group/20/',
                },
                is_default: true,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(600);

    mockEvolutionTransition({
      fromExternalId: 600,
      toExternalId: 601,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 20,
      name: 'sword-shield',
      generationId: 'generation-uuid',
    });

    await service.syncEvolutionChain(600);

    expect(referenceDataServiceMock.syncVersionGroup).toHaveBeenCalledWith(20);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: true,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: 'version-group-uuid',
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize a location evolution condition when the location already exists', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 700,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/700/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/701/',
            },
            evolution_details: [
              createEvolutionDetail({
                location: {
                  name: 'mt-coronet',
                  url: 'https://pokeapi.co/api/v2/location/10/',
                },
                is_default: true,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(700);

    mockEvolutionTransition({
      fromExternalId: 700,
      toExternalId: 701,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.location.findUnique.mockResolvedValue({
      id: 'mt-coronet-location-uuid',
      externalId: 10,
      name: 'mt-coronet',
      regionId: 'sinnoh-region-uuid',
    });

    await service.syncEvolutionChain(700);

    expect(prismaMock.location.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 10,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: true,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: 'mt-coronet-location-uuid',

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should keep locationId null when the evolution location is not synchronized yet', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 702,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/702/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/703/',
            },
            evolution_details: [
              createEvolutionDetail({
                location: {
                  name: 'unknown-location',
                  url: 'https://pokeapi.co/api/v2/location/999/',
                },
                is_default: true,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(702);

    mockEvolutionTransition({
      fromExternalId: 702,
      toExternalId: 703,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.location.findUnique.mockResolvedValue(null);

    await service.syncEvolutionChain(702);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: true,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should preserve false for a non-default evolution detail', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 800,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/800/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/801/',
            },
            evolution_details: [
              createEvolutionDetail({
                is_default: false,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(800);

    mockEvolutionTransition({
      fromExternalId: 800,
      toExternalId: 801,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    await service.syncEvolutionChain(800);

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: false,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });

  it('should synchronize base form and evolved form evolution conditions', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 900,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/900/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/901/',
            },
            evolution_details: [
              createEvolutionDetail({
                base_form: {
                  name: 'species-one',
                  url: 'https://pokeapi.co/api/v2/pokemon/900/',
                },
                evolved_form: {
                  name: 'species-two',
                  url: 'https://pokeapi.co/api/v2/pokemon/901/',
                },
                is_default: true,
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    mockEvolutionChain(900);

    mockEvolutionTransition({
      fromExternalId: 900,
      toExternalId: 901,
      fromSpeciesId: 'species-one-uuid',
      toSpeciesId: 'species-two-uuid',
      triggerId: 'level-up-trigger-uuid',
    });

    prismaMock.pokemonVariety.findUnique
      .mockResolvedValueOnce({
        id: 'base-variety-uuid',
        externalId: 900,
        name: 'species-one',
      })
      .mockResolvedValueOnce({
        id: 'evolved-variety-uuid',
        externalId: 901,
        name: 'species-two',
      });

    await service.syncEvolutionChain(900);

    expect(prismaMock.pokemonVariety.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 900,
      },
    });

    expect(prismaMock.pokemonVariety.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 901,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: true,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: null,
        usedMoveId: null,

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: 'base-variety-uuid',
        evolvedFormId: 'evolved-variety-uuid',
      },
    });
  });

  it('should synchronize known and used move evolution conditions', async () => {
    pokeApiClientMock.getEvolutionChain.mockResolvedValue({
      id: 900,
      chain: {
        species: {
          name: 'species-one',
          url: 'https://pokeapi.co/api/v2/pokemon-species/900/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'species-two',
              url: 'https://pokeapi.co/api/v2/pokemon-species/901/',
            },
            evolution_details: [
              createEvolutionDetail({
                known_move: {
                  name: 'mimic',
                  url: 'https://pokeapi.co/api/v2/move/102/',
                },
                used_move: {
                  name: 'rage-fist',
                  url: 'https://pokeapi.co/api/v2/move/889/',
                },
              }),
            ],
            evolves_to: [],
          },
        ],
      },
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 900,
    });

    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'species-one-uuid',
        externalId: 900,
      })
      .mockResolvedValueOnce({
        id: 'species-two-uuid',
        externalId: 901,
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: 'level-up-trigger-uuid',
    });

    prismaMock.evolution.upsert.mockResolvedValue({
      id: 'evolution-uuid',
    });

    prismaMock.move.upsert
      .mockResolvedValueOnce({
        id: 'mimic-uuid',
        externalId: 102,
        name: 'mimic',
      })
      .mockResolvedValueOnce({
        id: 'rage-fist-uuid',
        externalId: 889,
        name: 'rage-fist',
      });

    await service.syncEvolutionChain(900);

    expect(prismaMock.move.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 102,
      },
      update: {
        name: 'mimic',
      },
      create: {
        externalId: 102,
        name: 'mimic',
      },
    });

    expect(prismaMock.move.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 889,
      },
      update: {
        name: 'rage-fist',
      },
      create: {
        externalId: 889,
        name: 'rage-fist',
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',

        minLevel: null,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,

        gender: null,
        relativePhysicalStats: null,

        minMoveCount: null,
        minSteps: null,
        minDamageTaken: null,

        needsOverworldRain: null,
        turnUpsideDown: null,
        nearSpecialRock: null,
        needsMultiplayer: null,

        isDefault: null,

        timeOfDay: null,

        itemId: null,
        heldItemId: null,

        knownMoveId: 'mimic-uuid',
        usedMoveId: 'rage-fist-uuid',

        knownTypeId: null,
        partyTypeId: null,

        partySpeciesId: null,
        tradeSpeciesId: null,

        regionId: null,
        versionGroupId: null,
        locationId: null,

        baseFormId: null,
        evolvedFormId: null,
      },
    });
  });
});
