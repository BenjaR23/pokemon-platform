import { EvolutionService } from './evolution.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('EvolutionService', () => {
  let service: EvolutionService;

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
    evolutionRule: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new EvolutionService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
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
              {
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

                min_level: 16,
                min_happiness: null,
                min_beauty: null,
                min_affection: null,
                relative_physical_stats: null,

                needs_overworld_rain: false,
                turn_upside_down: false,

                time_of_day: '',
                gender: null,
              },
            ],
            evolves_to: [
              {
                species: {
                  name: 'venusaur',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/3/',
                },

                evolution_details: [
                  {
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

                    min_level: 32,
                    min_happiness: null,
                    min_beauty: null,
                    min_affection: null,
                    relative_physical_stats: null,

                    needs_overworld_rain: false,
                    turn_upside_down: false,

                    time_of_day: '',
                    gender: null,
                  },
                ],

                evolves_to: [],
              },
            ],
          },
        ],
      },
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

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
        timeOfDay: null,
        itemId: null,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'ivysaur-venusaur-evolution-uuid',
        minLevel: 32,
        minHappiness: null,
        minBeauty: null,
        minAffection: null,
        timeOfDay: null,
        itemId: null,
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
              {
                trigger: {
                  name: 'use-item',
                  url: 'https://pokeapi.co/api/v2/evolution-trigger/3/',
                },

                item: {
                  name: 'thunder-stone',
                  url: 'https://pokeapi.co/api/v2/item/83/',
                },

                held_item: null,
                known_move: null,
                known_move_type: null,
                location: null,
                party_species: null,
                party_type: null,
                trade_species: null,

                min_level: null,
                min_happiness: null,
                min_beauty: null,
                min_affection: null,
                relative_physical_stats: null,

                needs_overworld_rain: false,
                turn_upside_down: false,

                time_of_day: '',
                gender: null,
              },
            ],
            evolves_to: [],
          },
        ],
      },
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 10,
    });

    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'pikachu-uuid',
        externalId: 25,
        name: 'pikachu',
      })
      .mockResolvedValueOnce({
        id: 'raichu-uuid',
        externalId: 26,
        name: 'raichu',
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: 'use-item-trigger-uuid',
      externalId: 3,
      name: 'use-item',
    });

    prismaMock.evolution.upsert.mockResolvedValue({
      id: 'pikachu-raichu-evolution-uuid',
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
        timeOfDay: null,
        itemId: 'thunder-stone-uuid',
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
              {
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

                min_level: 16,
                min_happiness: null,
                min_beauty: null,
                min_affection: null,
                relative_physical_stats: null,

                needs_overworld_rain: false,
                turn_upside_down: false,

                time_of_day: '',
                gender: null,
              },
            ],
            evolves_to: [],
          },
        ],
      },
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

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
              {
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

                min_level: 20,
                min_happiness: null,
                min_beauty: null,
                min_affection: null,
                relative_physical_stats: null,

                needs_overworld_rain: false,
                turn_upside_down: false,

                time_of_day: '',
                gender: null,
              },
              {
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

                min_level: null,
                min_happiness: 160,
                min_beauty: null,
                min_affection: null,
                relative_physical_stats: null,

                needs_overworld_rain: false,
                turn_upside_down: false,

                time_of_day: '',
                gender: null,
              },
            ],
            evolves_to: [],
          },
        ],
      },
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    prismaMock.pokemonSpecies.findUnique
      .mockResolvedValueOnce({
        id: 'species-one-uuid',
        externalId: 1,
        name: 'species-one',
      })
      .mockResolvedValueOnce({
        id: 'species-two-uuid',
        externalId: 2,
        name: 'species-two',
      });

    prismaMock.evolutionTrigger.upsert.mockResolvedValue({
      id: 'level-up-trigger-uuid',
      externalId: 1,
      name: 'level-up',
    });

    prismaMock.evolution.upsert.mockResolvedValue({
      id: 'evolution-uuid',
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
        timeOfDay: null,
        itemId: null,
      },
    });

    expect(prismaMock.evolutionRule.create).toHaveBeenCalledWith({
      data: {
        evolutionId: 'evolution-uuid',
        minLevel: null,
        minHappiness: 160,
        minBeauty: null,
        minAffection: null,
        timeOfDay: null,
        itemId: null,
      },
    });
  });
});
