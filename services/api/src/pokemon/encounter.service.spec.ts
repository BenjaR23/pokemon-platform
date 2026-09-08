import { EncounterService } from './encounter.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferenceDataService } from './reference-data.service.js';
import { createPokemonSyncContext } from './pokemon-sync-context.js';

describe('EncounterService', () => {
  let service: EncounterService;

  const pokeApiClientMock = {
    getLocationArea: jest.fn(),
    getLocation: jest.fn(),
    getPokemonEncounters: jest.fn(),
    getEncounterConditionValue: jest.fn(),
    getVersion: jest.fn(),
  };

  const referenceDataServiceMock = {
    syncVersionGroup: jest.fn(),
  };

  const prismaMock = {
    region: {
      upsert: jest.fn(),
    },
    location: {
      upsert: jest.fn(),
    },
    locationArea: {
      upsert: jest.fn(),
    },
    pokemonVariety: {
      findUnique: jest.fn(),
    },
    acquisitionType: {
      upsert: jest.fn(),
    },
    game: {
      findUnique: jest.fn(),
    },
    pokemonAcquisition: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    encounterMethod: {
      upsert: jest.fn(),
    },
    pokemonEncounter: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    pokemonEncounterDetail: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    encounterCondition: {
      upsert: jest.fn(),
    },
    encounterConditionValue: {
      upsert: jest.fn(),
    },
    pokemonEncounterDetailCondition: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new EncounterService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
      referenceDataServiceMock as unknown as ReferenceDataService,
    );
  });

  it('syncs region, location and location area', async () => {
    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'kanto-route-2-south-towards-viridian-city',
      location: {
        name: 'kanto-route-2',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'kanto-route-2',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
      externalId: 1,
      name: 'kanto',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
      externalId: 3,
      name: 'kanto-route-2',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
      externalId: 296,
      name: 'kanto-route-2-south-towards-viridian-city',
    });

    await service.syncLocationArea(296);

    expect(pokeApiClientMock.getLocationArea).toHaveBeenCalledWith(296);
    expect(pokeApiClientMock.getLocation).toHaveBeenCalledWith(3);

    expect(prismaMock.region.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'kanto',
      },
      create: {
        externalId: 1,
        name: 'kanto',
      },
    });

    expect(prismaMock.location.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 3,
      },
      update: {
        name: 'kanto-route-2',
        regionId: 'region-uuid',
      },
      create: {
        externalId: 3,
        name: 'kanto-route-2',
        regionId: 'region-uuid',
      },
    });

    expect(prismaMock.locationArea.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 296,
      },
      update: {
        name: 'kanto-route-2-south-towards-viridian-city',
        locationId: 'location-uuid',
      },
      create: {
        externalId: 296,
        name: 'kanto-route-2-south-towards-viridian-city',
        locationId: 'location-uuid',
      },
    });
  });

  it('syncs pokemon encounters for an existing variety and game', async () => {
    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'kanto-route-2-south-towards-viridian-city',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 50,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    prismaMock.game.findUnique.mockResolvedValue({
      id: 'game-uuid',
      externalId: 1,
    });

    prismaMock.pokemonAcquisition.upsert.mockResolvedValue({
      id: 'acquisition-uuid',
    });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert.mockResolvedValue({
      id: 'encounter-uuid',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
    });

    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'kanto-route-2-south-towards-viridian-city',
      location: {
        name: 'kanto-route-2',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'kanto-route-2',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
    });

    prismaMock.pokemonEncounterDetail.create.mockResolvedValue({
      id: 'detail-uuid',
    });

    pokeApiClientMock.getVersion.mockResolvedValue({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    const syncContext = createPokemonSyncContext();

    await service.syncPokemonEncounters(1, syncContext);

    expect(pokeApiClientMock.getPokemonEncounters).toHaveBeenCalledWith(1);

    expect(prismaMock.pokemonAcquisition.upsert).toHaveBeenCalledWith({
      where: {
        varietyId_gameId_acquisitionTypeId: {
          varietyId: 'variety-uuid',
          gameId: 'game-uuid',
          acquisitionTypeId: 'acquisition-type-uuid',
        },
      },
      update: {},
      create: {
        varietyId: 'variety-uuid',
        gameId: 'game-uuid',
        acquisitionTypeId: 'acquisition-type-uuid',
      },
    });

    expect(prismaMock.encounterMethod.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'walk',
      },
      create: {
        externalId: 1,
        name: 'walk',
      },
    });

    expect(prismaMock.pokemonEncounter.upsert).toHaveBeenCalledWith({
      where: {
        acquisitionId_locationAreaId_methodId: {
          acquisitionId: 'acquisition-uuid',
          locationAreaId: 'location-area-uuid',
          methodId: 'method-uuid',
        },
      },
      update: {},
      create: {
        acquisitionId: 'acquisition-uuid',
        locationAreaId: 'location-area-uuid',
        methodId: 'method-uuid',
      },
    });

    expect(prismaMock.pokemonEncounterDetail.deleteMany).toHaveBeenCalledWith({
      where: {
        encounterId: 'encounter-uuid',
      },
    });

    expect(prismaMock.pokemonEncounterDetail.create).toHaveBeenCalledWith({
      data: {
        encounterId: 'encounter-uuid',
        minLevel: 3,
        maxLevel: 5,
        chance: 50,
      },
    });

    expect(pokeApiClientMock.getVersion).toHaveBeenCalledWith(1);

    expect(referenceDataServiceMock.syncVersionGroup).toHaveBeenCalledWith(
      1,
      undefined,
      syncContext,
    );
  });

  it('syncs encounter condition values', async () => {
    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'kanto-route-2-south-towards-viridian-city',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 50,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [
                  {
                    name: 'time-morning',
                    url: 'https://pokeapi.co/api/v2/encounter-condition-value/1/',
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'kanto-route-2-south-towards-viridian-city',
      location: {
        name: 'kanto-route-2',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'kanto-route-2',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    pokeApiClientMock.getEncounterConditionValue.mockResolvedValue({
      id: 1,
      name: 'time-morning',
      condition: {
        name: 'time',
        url: 'https://pokeapi.co/api/v2/encounter-condition/1/',
      },
    });

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    prismaMock.game.findUnique.mockResolvedValue({
      id: 'game-uuid',
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
    });

    prismaMock.pokemonAcquisition.upsert.mockResolvedValue({
      id: 'acquisition-uuid',
    });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert.mockResolvedValue({
      id: 'encounter-uuid',
    });

    prismaMock.pokemonEncounterDetail.create.mockResolvedValue({
      id: 'detail-uuid',
    });

    prismaMock.encounterCondition.upsert.mockResolvedValue({
      id: 'condition-uuid',
    });

    prismaMock.encounterConditionValue.upsert.mockResolvedValue({
      id: 'condition-value-uuid',
    });

    pokeApiClientMock.getVersion.mockResolvedValue({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    await service.syncPokemonEncounters(1, createPokemonSyncContext());

    expect(prismaMock.encounterCondition.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'time',
      },
      create: {
        externalId: 1,
        name: 'time',
      },
    });

    expect(prismaMock.encounterConditionValue.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'time-morning',
        conditionId: 'condition-uuid',
      },
      create: {
        externalId: 1,
        name: 'time-morning',
        conditionId: 'condition-uuid',
      },
    });

    expect(prismaMock.acquisitionType.upsert).toHaveBeenCalledWith({
      where: {
        code: 'encounter',
      },
      update: {
        name: 'Encounter',
      },
      create: {
        code: 'encounter',
        name: 'Encounter',
      },
    });

    expect(
      prismaMock.pokemonEncounterDetailCondition.create,
    ).toHaveBeenCalledWith({
      data: {
        encounterDetailId: 'detail-uuid',
        conditionValueId: 'condition-value-uuid',
      },
    });
  });

  it('reuses cached versions during the same sync', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'area-one',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 50,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
      {
        location_area: {
          name: 'area-two',
          url: 'https://pokeapi.co/api/v2/location-area/297/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 40,
            encounter_details: [
              {
                min_level: 4,
                max_level: 6,
                chance: 40,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    pokeApiClientMock.getVersion.mockResolvedValue({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    prismaMock.game.findUnique.mockResolvedValue({
      id: 'game-uuid',
      externalId: 1,
    });

    prismaMock.locationArea.upsert
      .mockResolvedValueOnce({
        id: 'location-area-uuid-1',
      })
      .mockResolvedValueOnce({
        id: 'location-area-uuid-2',
      });

    pokeApiClientMock.getLocationArea
      .mockResolvedValueOnce({
        id: 296,
        name: 'area-one',
        location: {
          name: 'location-one',
          url: 'https://pokeapi.co/api/v2/location/3/',
        },
      })
      .mockResolvedValueOnce({
        id: 297,
        name: 'area-two',
        location: {
          name: 'location-two',
          url: 'https://pokeapi.co/api/v2/location/4/',
        },
      });

    pokeApiClientMock.getLocation
      .mockResolvedValueOnce({
        id: 3,
        name: 'location-one',
        region: {
          name: 'kanto',
          url: 'https://pokeapi.co/api/v2/region/1/',
        },
      })
      .mockResolvedValueOnce({
        id: 4,
        name: 'location-two',
        region: {
          name: 'kanto',
          url: 'https://pokeapi.co/api/v2/region/1/',
        },
      });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert
      .mockResolvedValueOnce({
        id: 'location-uuid-1',
      })
      .mockResolvedValueOnce({
        id: 'location-uuid-2',
      });

    prismaMock.pokemonAcquisition.upsert.mockResolvedValue({
      id: 'acquisition-uuid',
    });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert
      .mockResolvedValueOnce({
        id: 'encounter-uuid-1',
      })
      .mockResolvedValueOnce({
        id: 'encounter-uuid-2',
      });

    prismaMock.pokemonEncounterDetail.create
      .mockResolvedValueOnce({
        id: 'detail-uuid-1',
      })
      .mockResolvedValueOnce({
        id: 'detail-uuid-2',
      });

    await service.syncPokemonEncounters(1, syncContext);

    expect(pokeApiClientMock.getVersion).toHaveBeenCalledTimes(1);
    expect(pokeApiClientMock.getVersion).toHaveBeenCalledWith(1);

    expect(syncContext.versions.get(1)).toEqual({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });
  });

  it('reuses cached location areas during the same sync', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'area-one',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 50,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
      {
        location_area: {
          name: 'area-one',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'blue',
              url: 'https://pokeapi.co/api/v2/version/2/',
            },
            max_chance: 40,
            encounter_details: [
              {
                min_level: 4,
                max_level: 6,
                chance: 40,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'area-one',
      location: {
        name: 'location-one',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'location-one',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
      externalId: 296,
      name: 'area-one',
      locationId: 'location-uuid',
    });

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

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    prismaMock.game.findUnique
      .mockResolvedValueOnce({
        id: 'game-red-uuid',
        externalId: 1,
      })
      .mockResolvedValueOnce({
        id: 'game-blue-uuid',
        externalId: 2,
      });

    prismaMock.pokemonAcquisition.upsert
      .mockResolvedValueOnce({
        id: 'acquisition-red-uuid',
      })
      .mockResolvedValueOnce({
        id: 'acquisition-blue-uuid',
      });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert
      .mockResolvedValueOnce({
        id: 'encounter-red-uuid',
      })
      .mockResolvedValueOnce({
        id: 'encounter-blue-uuid',
      });

    prismaMock.pokemonEncounterDetail.create
      .mockResolvedValueOnce({
        id: 'detail-red-uuid',
      })
      .mockResolvedValueOnce({
        id: 'detail-blue-uuid',
      });

    await service.syncPokemonEncounters(1, syncContext);

    expect(pokeApiClientMock.getLocationArea).toHaveBeenCalledTimes(1);
    expect(pokeApiClientMock.getLocationArea).toHaveBeenCalledWith(296);

    expect(pokeApiClientMock.getLocation).toHaveBeenCalledTimes(1);

    expect(syncContext.locationAreas.get(296)).toEqual({
      id: 'location-area-uuid',
      externalId: 296,
      name: 'area-one',
      locationId: 'location-uuid',
    });
  });

  it('reuses cached encounter condition values during the same sync', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'area-one',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 25,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [
                  {
                    name: 'time-morning',
                    url: 'https://pokeapi.co/api/v2/encounter-condition-value/1/',
                  },
                ],
              },
              {
                min_level: 5,
                max_level: 7,
                chance: 25,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [
                  {
                    name: 'time-morning',
                    url: 'https://pokeapi.co/api/v2/encounter-condition-value/1/',
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'area-one',
      location: {
        name: 'location-one',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'location-one',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
      externalId: 296,
      name: 'area-one',
      locationId: 'location-uuid',
    });

    pokeApiClientMock.getVersion.mockResolvedValue({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    prismaMock.game.findUnique.mockResolvedValue({
      id: 'game-uuid',
      externalId: 1,
    });

    prismaMock.pokemonAcquisition.upsert.mockResolvedValue({
      id: 'acquisition-uuid',
    });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert.mockResolvedValue({
      id: 'encounter-uuid',
    });

    prismaMock.pokemonEncounterDetail.create
      .mockResolvedValueOnce({
        id: 'detail-uuid-1',
      })
      .mockResolvedValueOnce({
        id: 'detail-uuid-2',
      });

    pokeApiClientMock.getEncounterConditionValue.mockResolvedValue({
      id: 1,
      name: 'time-morning',
      condition: {
        name: 'time',
        url: 'https://pokeapi.co/api/v2/encounter-condition/1/',
      },
    });

    prismaMock.encounterCondition.upsert.mockResolvedValue({
      id: 'condition-uuid',
    });

    prismaMock.encounterConditionValue.upsert.mockResolvedValue({
      id: 'condition-value-uuid',
      externalId: 1,
      name: 'time-morning',
      conditionId: 'condition-uuid',
    });

    await service.syncPokemonEncounters(1, syncContext);

    expect(pokeApiClientMock.getEncounterConditionValue).toHaveBeenCalledTimes(
      1,
    );

    expect(prismaMock.encounterCondition.upsert).toHaveBeenCalledTimes(1);

    expect(prismaMock.encounterConditionValue.upsert).toHaveBeenCalledTimes(1);

    expect(syncContext.encounterConditionValues.get(1)).toEqual({
      id: 'condition-value-uuid',
      externalId: 1,
      name: 'time-morning',
      conditionId: 'condition-uuid',
    });
  });

  it('removes stale pokemon encounters after synchronization', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([
      {
        location_area: {
          name: 'area-one',
          url: 'https://pokeapi.co/api/v2/location-area/296/',
        },
        version_details: [
          {
            version: {
              name: 'red',
              url: 'https://pokeapi.co/api/v2/version/1/',
            },
            max_chance: 50,
            encounter_details: [
              {
                min_level: 3,
                max_level: 5,
                chance: 50,
                method: {
                  name: 'walk',
                  url: 'https://pokeapi.co/api/v2/encounter-method/1/',
                },
                condition_values: [],
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    pokeApiClientMock.getLocationArea.mockResolvedValue({
      id: 296,
      name: 'area-one',
      location: {
        name: 'location-one',
        url: 'https://pokeapi.co/api/v2/location/3/',
      },
    });

    pokeApiClientMock.getLocation.mockResolvedValue({
      id: 3,
      name: 'location-one',
      region: {
        name: 'kanto',
        url: 'https://pokeapi.co/api/v2/region/1/',
      },
    });

    prismaMock.region.upsert.mockResolvedValue({
      id: 'region-uuid',
    });

    prismaMock.location.upsert.mockResolvedValue({
      id: 'location-uuid',
    });

    prismaMock.locationArea.upsert.mockResolvedValue({
      id: 'location-area-uuid',
      externalId: 296,
      name: 'area-one',
      locationId: 'location-uuid',
    });

    pokeApiClientMock.getVersion.mockResolvedValue({
      id: 1,
      name: 'red',
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
    });

    prismaMock.game.findUnique.mockResolvedValue({
      id: 'game-uuid',
      externalId: 1,
    });

    prismaMock.pokemonAcquisition.upsert.mockResolvedValue({
      id: 'acquisition-uuid',
    });

    prismaMock.encounterMethod.upsert.mockResolvedValue({
      id: 'method-uuid',
    });

    prismaMock.pokemonEncounter.upsert.mockResolvedValue({
      id: 'current-encounter-uuid',
    });

    prismaMock.pokemonEncounterDetail.create.mockResolvedValue({
      id: 'detail-uuid',
    });

    await service.syncPokemonEncounters(1, syncContext);

    expect(prismaMock.pokemonEncounter.deleteMany).toHaveBeenCalledWith({
      where: {
        acquisition: {
          varietyId: 'variety-uuid',
          acquisitionTypeId: 'acquisition-type-uuid',
        },
        id: {
          notIn: ['current-encounter-uuid'],
        },
      },
    });
  });

  it('removes all existing encounters when PokeAPI returns none', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    await service.syncPokemonEncounters(1, syncContext);

    expect(prismaMock.pokemonEncounter.deleteMany).toHaveBeenCalledWith({
      where: {
        acquisition: {
          varietyId: 'variety-uuid',
          acquisitionTypeId: 'acquisition-type-uuid',
        },
      },
    });
  });

  it('removes encounter acquisitions that no longer have encounters', async () => {
    const syncContext = createPokemonSyncContext();

    pokeApiClientMock.getPokemonEncounters.mockResolvedValue([]);

    prismaMock.pokemonVariety.findUnique.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
    });

    prismaMock.acquisitionType.upsert.mockResolvedValue({
      id: 'acquisition-type-uuid',
    });

    await service.syncPokemonEncounters(1, syncContext);

    expect(prismaMock.pokemonAcquisition.deleteMany).toHaveBeenCalledWith({
      where: {
        varietyId: 'variety-uuid',
        acquisitionTypeId: 'acquisition-type-uuid',
        encounters: {
          none: {},
        },
      },
    });
  });
});
