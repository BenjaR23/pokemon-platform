import { Injectable, NotFoundException } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferenceDataService } from './reference-data.service.js';
import { PokemonSyncContext } from './pokemon-sync-context.js';

function getExternalIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts.at(-1));

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid PokeAPI resource URL: ${url}`);
  }

  return id;
}

@Injectable()
export class EncounterService {
  constructor(
    private readonly pokeApiClient: PokeApiClient,
    private readonly prisma: PrismaService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  async findPokemonEncounters(externalId: number, variantExternalId?: number) {
    const pokemon = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId,
      },

      select: {
        externalId: true,

        varieties: {
          select: {
            externalId: true,
            name: true,
            isDefault: true,

            pokemonAcquisitions: {
              orderBy: {
                game: {
                  externalId: 'asc',
                },
              },

              select: {
                acquisitionType: {
                  select: {
                    code: true,
                    name: true,
                  },
                },

                game: {
                  select: {
                    externalId: true,

                    name: true,

                    versionGroup: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },

                encounters: {
                  select: {
                    locationArea: {
                      select: {
                        externalId: true,

                        name: true,

                        location: {
                          select: {
                            externalId: true,

                            name: true,

                            region: {
                              select: {
                                name: true,
                              },
                            },
                          },
                        },
                      },
                    },

                    method: {
                      select: {
                        name: true,
                      },
                    },

                    details: {
                      select: {
                        minLevel: true,

                        maxLevel: true,

                        chance: true,

                        conditions: {
                          select: {
                            conditionValue: {
                              select: {
                                name: true,

                                condition: {
                                  select: {
                                    name: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pokemon) {
      throw new NotFoundException(
        `Pokemon with id ${externalId} was not found`,
      );
    }

    const defaultVariety = pokemon.varieties.find(
      (variety) => variety.isDefault,
    );

    const selectedVariant =
      variantExternalId !== undefined
        ? pokemon.varieties.find(
            (variety) => variety.externalId === variantExternalId,
          )
        : defaultVariety;

    if (!selectedVariant) {
      if (variantExternalId !== undefined) {
        throw new NotFoundException(
          `Variant with id ${variantExternalId} was not found for Pokemon ${externalId}`,
        );
      }

      return {
        pokemonId: pokemon.externalId,

        games: [],
      };
    }

    return {
      pokemonId: pokemon.externalId,

      games: selectedVariant.pokemonAcquisitions.map((acquisition) => ({
        id: acquisition.game.externalId,

        name: acquisition.game.name,

        versionGroup: acquisition.game.versionGroup.name,

        acquisitionType: {
          code: acquisition.acquisitionType.code,

          name: acquisition.acquisitionType.name,
        },

        encounters: acquisition.encounters.map((encounter) => ({
          location: {
            id: encounter.locationArea.location.externalId,

            name: encounter.locationArea.location.name,

            region: encounter.locationArea.location.region.name,
          },

          area: {
            id: encounter.locationArea.externalId,

            name: encounter.locationArea.name,
          },

          method: encounter.method.name,

          details: encounter.details.map((detail) => ({
            minLevel: detail.minLevel,

            maxLevel: detail.maxLevel,

            chance: detail.chance,

            conditions: detail.conditions.map((condition) => ({
              type: condition.conditionValue.condition.name,

              value: condition.conditionValue.name,
            })),
          })),
        })),
      })),
    };
  }

  async syncLocationArea(externalId: number, syncContext?: PokemonSyncContext) {
    const cachedLocationArea = syncContext?.locationAreas.get(externalId);

    if (cachedLocationArea) {
      return cachedLocationArea;
    }

    const locationArea = await this.pokeApiClient.getLocationArea(externalId);

    const locationExternalId = getExternalIdFromUrl(locationArea.location.url);

    const location = await this.pokeApiClient.getLocation(locationExternalId);

    const regionExternalId = getExternalIdFromUrl(location.region.url);

    const region = await this.prisma.region.upsert({
      where: {
        externalId: regionExternalId,
      },
      update: {
        name: location.region.name,
      },
      create: {
        externalId: regionExternalId,
        name: location.region.name,
      },
    });

    const savedLocation = await this.prisma.location.upsert({
      where: {
        externalId: location.id,
      },
      update: {
        name: location.name,
        regionId: region.id,
      },
      create: {
        externalId: location.id,
        name: location.name,
        regionId: region.id,
      },
    });

    const savedLocationArea = await this.prisma.locationArea.upsert({
      where: {
        externalId: locationArea.id,
      },
      update: {
        name: locationArea.name,
        locationId: savedLocation.id,
      },
      create: {
        externalId: locationArea.id,
        name: locationArea.name,
        locationId: savedLocation.id,
      },
    });

    syncContext?.locationAreas.set(externalId, savedLocationArea);

    return savedLocationArea;
  }

  async syncPokemonEncounters(
    varietyExternalId: number,
    syncContext: PokemonSyncContext,
  ) {
    const encounters =
      await this.pokeApiClient.getPokemonEncounters(varietyExternalId);

    const variety = await this.prisma.pokemonVariety.findUnique({
      where: {
        externalId: varietyExternalId,
      },
    });

    if (!variety) {
      return;
    }

    const acquisitionType = await this.prisma.acquisitionType.upsert({
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

    const synchronizedEncounterIds = new Set<string>();

    for (const encounter of encounters) {
      const locationAreaExternalId = getExternalIdFromUrl(
        encounter.location_area.url,
      );

      const locationArea = await this.syncLocationArea(
        locationAreaExternalId,
        syncContext,
      );

      for (const versionDetail of encounter.version_details) {
        const gameExternalId = getExternalIdFromUrl(versionDetail.version.url);

        let version = syncContext.versions.get(gameExternalId);

        if (!version) {
          version = await this.pokeApiClient.getVersion(gameExternalId);
          syncContext.versions.set(gameExternalId, version);
        }

        const versionGroupExternalId = getExternalIdFromUrl(
          version.version_group.url,
        );

        await this.referenceDataService.syncVersionGroup(
          versionGroupExternalId,
          undefined,
          syncContext,
        );

        const game = await this.prisma.game.findUnique({
          where: {
            externalId: gameExternalId,
          },
        });

        if (!game) {
          throw new Error(
            `Game ${gameExternalId} was not created after synchronizing its VersionGroup`,
          );
        }

        const acquisition = await this.prisma.pokemonAcquisition.upsert({
          where: {
            varietyId_gameId_acquisitionTypeId: {
              varietyId: variety.id,
              gameId: game.id,
              acquisitionTypeId: acquisitionType.id,
            },
          },
          update: {},
          create: {
            varietyId: variety.id,
            gameId: game.id,
            acquisitionTypeId: acquisitionType.id,
          },
        });

        // Agrupa detalles por método para reemplazarlos de forma idempotente.
        const detailsByMethod = new Map<
          number,
          typeof versionDetail.encounter_details
        >();

        for (const detail of versionDetail.encounter_details) {
          const methodExternalId = getExternalIdFromUrl(detail.method.url);

          const details = detailsByMethod.get(methodExternalId) ?? [];
          details.push(detail);

          detailsByMethod.set(methodExternalId, details);
        }

        for (const [methodExternalId, details] of detailsByMethod) {
          const methodResource = details[0].method;

          const method = await this.prisma.encounterMethod.upsert({
            where: {
              externalId: methodExternalId,
            },
            update: {
              name: methodResource.name,
            },
            create: {
              externalId: methodExternalId,
              name: methodResource.name,
            },
          });

          const savedEncounter = await this.prisma.pokemonEncounter.upsert({
            where: {
              acquisitionId_locationAreaId_methodId: {
                acquisitionId: acquisition.id,
                locationAreaId: locationArea.id,
                methodId: method.id,
              },
            },
            update: {},
            create: {
              acquisitionId: acquisition.id,
              locationAreaId: locationArea.id,
              methodId: method.id,
            },
          });

          synchronizedEncounterIds.add(savedEncounter.id);

          await this.prisma.pokemonEncounterDetail.deleteMany({
            where: {
              encounterId: savedEncounter.id,
            },
          });

          for (const detail of details) {
            const savedDetail = await this.prisma.pokemonEncounterDetail.create(
              {
                data: {
                  encounterId: savedEncounter.id,
                  minLevel: detail.min_level,
                  maxLevel: detail.max_level,
                  chance: detail.chance,
                },
              },
            );

            for (const conditionResource of detail.condition_values) {
              const conditionValue = await this.syncConditionValue(
                conditionResource,
                syncContext,
              );

              await this.prisma.pokemonEncounterDetailCondition.create({
                data: {
                  encounterDetailId: savedDetail.id,
                  conditionValueId: conditionValue.id,
                },
              });
            }
          }
        }
      }
    }
    if (synchronizedEncounterIds.size > 0) {
      await this.prisma.pokemonEncounter.deleteMany({
        where: {
          acquisition: {
            varietyId: variety.id,
            acquisitionTypeId: acquisitionType.id,
          },
          id: {
            notIn: [...synchronizedEncounterIds],
          },
        },
      });
    } else {
      await this.prisma.pokemonEncounter.deleteMany({
        where: {
          acquisition: {
            varietyId: variety.id,
            acquisitionTypeId: acquisitionType.id,
          },
        },
      });
    }

    await this.prisma.pokemonAcquisition.deleteMany({
      where: {
        varietyId: variety.id,
        acquisitionTypeId: acquisitionType.id,
        encounters: {
          none: {},
        },
      },
    });
  }

  private async syncConditionValue(
    resource: {
      name: string;
      url: string;
    },
    syncContext: PokemonSyncContext,
  ) {
    const externalId = getExternalIdFromUrl(resource.url);

    const cachedConditionValue =
      syncContext.encounterConditionValues.get(externalId);

    if (cachedConditionValue) {
      return cachedConditionValue;
    }

    const conditionValue =
      await this.pokeApiClient.getEncounterConditionValue(externalId);

    const conditionExternalId = getExternalIdFromUrl(
      conditionValue.condition.url,
    );

    const condition = await this.prisma.encounterCondition.upsert({
      where: {
        externalId: conditionExternalId,
      },
      update: {
        name: conditionValue.condition.name,
      },
      create: {
        externalId: conditionExternalId,
        name: conditionValue.condition.name,
      },
    });

    const savedConditionValue =
      await this.prisma.encounterConditionValue.upsert({
        where: {
          externalId: conditionValue.id,
        },
        update: {
          name: conditionValue.name,
          conditionId: condition.id,
        },
        create: {
          externalId: conditionValue.id,
          name: conditionValue.name,
          conditionId: condition.id,
        },
      });

    syncContext.encounterConditionValues.set(externalId, savedConditionValue);

    return savedConditionValue;
  }
}
