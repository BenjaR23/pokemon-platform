import { Injectable, NotFoundException } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferenceDataService } from './reference-data.service.js';
import {
  PokemonSyncContext,
  createPokemonSyncContext,
} from './pokemon-sync-context.js';
import { EncounterService } from './encounter.service.js';
import type { Prisma } from '../generated/prisma/client.js';

const evolutionRuleInclude = {
  item: {
    select: {
      name: true,
    },
  },
  heldItem: {
    select: {
      name: true,
    },
  },
  knownMove: {
    select: {
      externalId: true,
      name: true,
    },
  },
  usedMove: {
    select: {
      externalId: true,
      name: true,
    },
  },
  knownType: {
    select: {
      name: true,
    },
  },
  location: {
    select: {
      name: true,
    },
  },
  partySpecies: {
    select: {
      externalId: true,
      name: true,
    },
  },
  partyType: {
    select: {
      name: true,
    },
  },
  tradeSpecies: {
    select: {
      externalId: true,
      name: true,
    },
  },
  region: {
    select: {
      name: true,
    },
  },
  versionGroup: {
    select: {
      externalId: true,
      name: true,
      generation: {
        select: {
          externalId: true,
          name: true,
        },
      },
    },
  },
  baseForm: {
    select: {
      externalId: true,
      name: true,
    },
  },
  evolvedForm: {
    select: {
      externalId: true,
      name: true,
    },
  },
} satisfies Prisma.EvolutionRuleInclude;

type EvolutionRuleWithRelations = Prisma.EvolutionRuleGetPayload<{
  include: typeof evolutionRuleInclude;
}>;

// Extrae el ID numerico de una URL de recurso de PokeAPI.
function getExternalIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts.at(-1));

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid PokeAPI resource URL: ${url}`);
  }

  return id;
}
@Injectable()
export class PokemonService {
  constructor(
    // Cliente responsable exclusivamente de comunicarse con PokeAPI.
    private readonly pokeApiClient: PokeApiClient,

    // PrismaService nos permite persistir los datos obtenidos en PostgreSQL.
    private readonly prisma: PrismaService,

    // Servicio responsable de sincronizar datos de referencia compartidos por muchas especies.
    private readonly referenceDataService: ReferenceDataService,

    private readonly encounterService: EncounterService,
  ) {}

  /**
   * Sincroniza una especie individual desde PokeAPI.
   *
   * Flujo:
   * 1. Obtener la especie desde PokeAPI.
   * 2. Resolver la generacion asociada.
   * 3. Resolver la cadena evolutiva asociada.
   * 4. Crear o actualizar la especie de PostgreSQL.
   */
  async syncSpecies(
    externalId: number,
    syncContext: PokemonSyncContext = createPokemonSyncContext(),
  ) {
    // Obtenemos la informacion de la especie desde PokeAPI.
    const species = await this.pokeApiClient.getPokemonSpecies(externalId);

    // Se extrae el externalId de la generacion y se sincroniza
    // tambien su estructura VersionGroup -> Game.
    const generationExternalId = getExternalIdFromUrl(species.generation.url);

    const generation = await this.referenceDataService.syncGeneration(
      generationExternalId,
      syncContext,
    );

    // Solo se crea una cadena evolutiva asociada si PokeAPI proporciona la url.
    let evolutionChainId: string | null = null;

    if (species.evolution_chain) {
      const evolutionChainExternalId = getExternalIdFromUrl(
        species.evolution_chain.url,
      );

      // Se crea la cadena evolutiva si no existe.
      const evolutionChain = await this.prisma.evolutionChain.upsert({
        where: {
          externalId: evolutionChainExternalId,
        },
        update: {},
        create: {
          externalId: evolutionChainExternalId,
        },
      });

      // Se guarda el UUID interno generado por la base de datos.
      evolutionChainId = evolutionChain.id;
    }

    // Se crea o actualiza la especie en nuestra base de datos.
    const savedSpecies = await this.prisma.pokemonSpecies.upsert({
      where: {
        externalId: species.id,
      },
      update: {
        name: species.name,
        generationId: generation.id,
        evolutionChainId,
      },
      create: {
        externalId: species.id,
        name: species.name,
        generationId: generation.id,
        evolutionChainId,
      },
    });

    // Se sincroniza el nombre que se mostrara al usuario.
    // Actualmente se prioriza español con ingles como fallback.
    await this.syncSpeciesName(savedSpecies.id, species.names);

    // Se recorren todas las variedades asociadas a la especie.
    for (const variety of species.varieties) {
      // El ID externo de la variedad esta contenido en la URL /pokemon/:id.
      const varietyExternalId = getExternalIdFromUrl(variety.pokemon.url);

      // consulta el endpoint porque contiene datos propios de la variedad concreta.
      const pokemon = await this.pokeApiClient.getPokemon(varietyExternalId);

      // Se crea o actualiza la variedad.
      // isDefault toma directamente desde PokemonSpeceies.varieties.
      const savedVariety = await this.prisma.pokemonVariety.upsert({
        where: {
          externalId: pokemon.id,
        },
        update: {
          name: pokemon.name,
          isDefault: variety.is_default,
          speciesId: savedSpecies.id,
        },
        create: {
          externalId: pokemon.id,
          name: pokemon.name,
          isDefault: variety.is_default,
          speciesId: savedSpecies.id,
        },
      });

      // Una vez persistida la variedad, se sincronizan los datos que dependen de ella.
      await this.syncTypes(savedVariety.id, pokemon.types);
      await this.syncAbilities(savedVariety.id, pokemon.abilities);
      await this.syncStats(savedVariety.id, pokemon.stats);
      await this.syncForms(savedVariety.id, pokemon.forms, syncContext);

      await this.encounterService.syncPokemonEncounters(
        pokemon.id,
        syncContext,
      );
    }

    // Por ahora se devuelve PokemonSpecies.
    return savedSpecies;
  }

  /**
   * Sinctroniza las formas asociadas a una variedad.
   *
   * Cada referencia obtenida desde /pokemon/:id apunta
   * al endpoint /pokemon-form/:id.
   */
  private async syncForms(
    varietyId: string,
    forms: Array<{
      name: string;
      url: string;
    }>,
    syncContext?: PokemonSyncContext,
  ) {
    for (const formResource of forms) {
      // Se extrae el ID externo desde la URL del recurso.
      const formExternalId = getExternalIdFromUrl(formResource.url);

      // Se consulta los detalles de la forma.
      const form = await this.pokeApiClient.getPokemonForm(formExternalId);

      // PokeAPI utiliza strings vacios en algunos nombres de forma.
      // La base de datos usa null cuando no existe un formName util.
      const formName = form.form_name || null;

      // Por defecto la forma puede no estar asociada a ningun VersionGroup.
      let versionGroupId: string | null = null;

      if (form.version_group) {
        // La url de PokeAPI contiene el externalId del VersionGroup.
        const versionGroupExternalId = getExternalIdFromUrl(
          form.version_group.url,
        );

        let versionGroup = await this.prisma.versionGroup.findUnique({
          where: {
            externalId: versionGroupExternalId,
          },
        });

        // Si VersionGroup todavia no existe en la base de datos, lo sincronizamos bajo demanda usando ReferenceDataService.
        if (!versionGroup) {
          versionGroup = await this.referenceDataService.syncVersionGroup(
            versionGroupExternalId,
            undefined,
            syncContext,
          );
        }

        versionGroupId = versionGroup.id;
      }

      /**
       * Por ahora Mega y Gigantamax quedan en false.
       * Mas adelante se implementara una clasificacion explicita
       * en lugar de inferirla aqui de forma improvisada.
       */
      await this.prisma.pokemonForm.upsert({
        where: {
          externalId: form.id,
        },
        update: {
          name: form.name,
          formName,
          isDefault: form.is_default,
          isBattleOnly: form.is_battle_only,
          isMega: false,
          isGigantamax: false,
          varietyId,
          versionGroupId,
        },
        create: {
          externalId: form.id,
          name: form.name,
          formName,
          isDefault: form.is_default,
          isBattleOnly: form.is_battle_only,
          isMega: false,
          isGigantamax: false,
          varietyId,
          versionGroupId,
        },
      });
    }
  }

  /**
   * Sincroniza los tipos asociados a una variedad de Pokemon.
   *
   * Para cada tipo:
   * 1. Se obtiene su externalId desde la URL de PokeAPI.
   * 2. Se crea o actualiza el registro Type.
   * 3. Se crea o actualiza la relacion PokemonVarietyType.
   */
  private async syncTypes(
    varietyId: string,
    types: Array<{
      slot: number;
      type: {
        name: string;
        url: string;
      };
    }>,
  ) {
    for (const pokemonType of types) {
      // Se extrae ID externo desde la URL de PokeAPI.
      const typeExternalId = getExternalIdFromUrl(pokemonType.type.url);

      // Se crea o actualiza el tipo.
      const type = await this.prisma.type.upsert({
        where: {
          externalId: typeExternalId,
        },
        update: {
          name: pokemonType.type.name,
        },
        create: {
          externalId: typeExternalId,
          name: pokemonType.type.name,
        },
      });

      // Se crea o actualiza la relacion entre variedad y tipo.
      await this.prisma.pokemonVarietyType.upsert({
        where: {
          varietyId_slot: {
            varietyId,
            slot: pokemonType.slot,
          },
        },
        update: {
          typeId: type.id,
        },
        create: {
          varietyId,
          typeId: type.id,
          slot: pokemonType.slot,
        },
      });
    }
  }

  /**
   * Sincroniza las abilidades asociadas a una variedad.
   *
   * Primero se sincroniza Ability y luego se crea
   * la relacion many-to-may con PokemonVariety.
   */
  private async syncAbilities(
    varietyId: string,
    abilities: Array<{
      is_hidden: boolean;
      slot: number;
      ability: {
        name: string;
        url: string;
      };
    }>,
  ) {
    for (const pokemonAbility of abilities) {
      // Se obtiene el ID externo de la habilidad.
      const abilityExternalId = getExternalIdFromUrl(
        pokemonAbility.ability.url,
      );

      // Se crea o actualiza ability.
      const ability = await this.prisma.ability.upsert({
        where: {
          externalId: abilityExternalId,
        },
        update: {
          name: pokemonAbility.ability.name,
        },
        create: {
          externalId: abilityExternalId,
          name: pokemonAbility.ability.name,
        },
      });

      // La tabla puente utiliza varietyId + abilityId como PK compuesta.
      await this.prisma.pokemonVarietyAbility.upsert({
        where: {
          varietyId_abilityId: {
            varietyId,
            abilityId: ability.id,
          },
        },
        update: {},
        create: {
          varietyId,
          abilityId: ability.id,
        },
      });
    }
  }

  /**
   * Sincroniza las estadisticas base de una variedad.
   *
   * PokeAPI entrega las estadisticas como un array,
   * mientras que el modelo lasalmacane en columnas.
   */
  private async syncStats(
    varietyId: string,
    stats: Array<{
      base_stat: number;
      effort: number;
      stat: {
        name: string;
        url: string;
      };
    }>,
  ) {
    // Se convierte el array de PokeAPI en un mapa.
    const statsMap = new Map(
      stats.map((stat) => [stat.stat.name, stat.base_stat]),
    );

    // Se valida que las seis estadisticas esperadas existan.
    const hp = statsMap.get('hp');
    const attack = statsMap.get('attack');
    const defense = statsMap.get('defense');
    const specialAttack = statsMap.get('special-attack');
    const specialDefense = statsMap.get('special-defense');
    const speed = statsMap.get('speed');

    if (
      hp === undefined ||
      attack === undefined ||
      defense === undefined ||
      specialAttack === undefined ||
      specialDefense === undefined ||
      speed === undefined
    ) {
      throw new Error('incomplete Pokemon stats received from PokeAPI');
    }

    // PokemonVarietyStats tiene una relacion 1:1 con PokemonVariety.
    // VarietyId funciona tambien como su primary key.
    await this.prisma.pokemonVarietyStats.upsert({
      where: {
        varietyId,
      },
      update: {
        hp,
        attack,
        defense,
        specialAttack,
        specialDefense,
        speed,
      },
      create: {
        varietyId,
        hp,
        attack,
        defense,
        specialAttack,
        specialDefense,
        speed,
      },
    });
  }

  private async syncSpeciesName(
    speciesId: string,
    names: Array<{
      name: string;
      language: {
        name: string;
        url: string;
      };
    }>,
  ) {
    /**
     * Se prioriza español como idioma de la aplicacion
     * Ingles se utiliza unicamente como fallback si PokeAPI no proporciona un nombre en español.
     */
    const localizedName =
      names.find((entry) => entry.language.name === 'es') ??
      names.find((entry) => entry.language.name === 'en');

    // Si PokeApi no proporciona ninguno de los idiomas soportados, no se crea un registro localizado.
    if (!localizedName) {
      return;
    }

    // El ID externo del idioma se obtiene directamente desde la URL de PokeAPI, evitando una peticion HTTP adicional.
    const languageExternalId = getExternalIdFromUrl(localizedName.language.url);

    // Language se mantiene como entidad independiente para que se pueda soportar mas idiomas en el futuro sin modificar el schema.
    const language = await this.prisma.language.upsert({
      where: {
        externalId: languageExternalId,
      },
      update: {
        name: localizedName.language.name,
      },
      create: {
        externalId: languageExternalId,
        name: localizedName.language.name,
      },
    });

    // Se guarda un unico nombre por combinacion especie + idioma.
    await this.prisma.pokemonSpeciesName.upsert({
      where: {
        speciesId_languageId: {
          speciesId,
          languageId: language.id,
        },
      },
      update: {
        name: localizedName.name,
      },
      create: {
        speciesId,
        languageId: language.id,
        name: localizedName.name,
      },
    });
  }

  private mapEvolutionRule(rule: EvolutionRuleWithRelations) {
    return {
      minLevel: rule.minLevel,
      minHappiness: rule.minHappiness,
      minBeauty: rule.minBeauty,
      minAffection: rule.minAffection,
      timeOfDay: rule.timeOfDay,

      gender: rule.gender,
      relativePhysicalStats: rule.relativePhysicalStats,
      needsOverworldRain: rule.needsOverworldRain,
      turnUpsideDown: rule.turnUpsideDown,
      nearSpecialRock: rule.nearSpecialRock,
      needsMultiplayer: rule.needsMultiplayer,

      minMoveCount: rule.minMoveCount,
      minSteps: rule.minSteps,
      minDamageTaken: rule.minDamageTaken,

      item: rule.item?.name ?? null,
      heldItem: rule.heldItem?.name ?? null,

      knownMove: rule.knownMove
        ? {
            id: rule.knownMove.externalId,
            name: rule.knownMove.name,
          }
        : null,

      usedMove: rule.usedMove
        ? {
            id: rule.usedMove.externalId,
            name: rule.usedMove.name,
          }
        : null,

      knownType: rule.knownType?.name ?? null,
      location: rule.location?.name ?? null,

      partySpecies: rule.partySpecies
        ? {
            id: rule.partySpecies.externalId,
            name: rule.partySpecies.name,
          }
        : null,

      partyType: rule.partyType?.name ?? null,

      tradeSpecies: rule.tradeSpecies
        ? {
            id: rule.tradeSpecies.externalId,
            name: rule.tradeSpecies.name,
          }
        : null,

      region: rule.region?.name ?? null,

      versionGroup: rule.versionGroup
        ? {
            id: rule.versionGroup.externalId,
            name: rule.versionGroup.name,
            generation: {
              id: rule.versionGroup.generation.externalId,
              name: rule.versionGroup.generation.name,
            },
          }
        : null,

      baseForm: rule.baseForm
        ? {
            id: rule.baseForm.externalId,
            name: rule.baseForm.name,
          }
        : null,

      evolvedForm: rule.evolvedForm
        ? {
            id: rule.evolvedForm.externalId,
            name: rule.evolvedForm.name,
          }
        : null,
    };
  }

  async findAll(
    page: number,
    pageSize: number,
    search?: string,
    type?: string,
    generation?: number,
  ) {
    const skip = (page - 1) * pageSize;

    const trimmedSearch = search?.trim();
    const trimmedType = type?.trim();

    const where: Prisma.PokemonSpeciesWhereInput = {};

    if (trimmedSearch) {
      const numericSearch = /^\d+$/.test(trimmedSearch)
        ? Number(trimmedSearch)
        : null;

      if (numericSearch !== null) {
        where.externalId = numericSearch;
      } else {
        where.name = {
          contains: trimmedSearch,
          mode: 'insensitive',
        };
      }
    }

    if (trimmedType) {
      where.varieties = {
        some: {
          isDefault: true,
          types: {
            some: {
              type: {
                name: trimmedType,
              },
            },
          },
        },
      };
    }

    if (generation) {
      where.generation = {
        externalId: generation,
      };
    }

    const [species, total] = await Promise.all([
      this.prisma.pokemonSpecies.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          externalId: 'asc',
        },
        include: {
          generation: {
            select: {
              externalId: true,
            },
          },
          varieties: {
            where: {
              isDefault: true,
            },
            take: 1,
            select: {
              types: {
                orderBy: {
                  slot: 'asc',
                },
                select: {
                  type: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.pokemonSpecies.count({
        where,
      }),
    ]);

    const items = species.map((pokemon) => ({
      id: pokemon.externalId,
      name: pokemon.name,
      generation: pokemon.generation?.externalId ?? null,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.externalId}.png`,
      types:
        pokemon.varieties[0]?.types.map(
          (pokemonType) => pokemonType.type.name,
        ) ?? [],
    }));

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(externalId: number, variantExternalId?: number) {
    const pokemon = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId,
      },
      include: {
        generation: {
          select: {
            externalId: true,
            name: true,
          },
        },
        varieties: {
          select: {
            externalId: true,
            name: true,
            isDefault: true,

            types: {
              orderBy: {
                slot: 'asc',
              },
              select: {
                type: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            pokemonVarietyAbilities: {
              select: {
                ability: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            pokemonVarietyStats: {
              select: {
                hp: true,
                attack: true,
                defense: true,
                specialAttack: true,
                specialDefense: true,
                speed: true,
              },
            },
          },
        },
        evolutionChain: {
          select: {
            species: {
              select: {
                id: true,
                externalId: true,
                name: true,
              },
            },
            evolution: {
              select: {
                id: true,
                fromSpeciesId: true,
                toSpeciesId: true,
                fromSpecies: {
                  select: {
                    externalId: true,
                    name: true,
                  },
                },
                toSpecies: {
                  select: {
                    externalId: true,
                    name: true,
                  },
                },
                trigger: {
                  select: {
                    name: true,
                  },
                },
                rules: {
                  include: evolutionRuleInclude,
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

      throw new NotFoundException(
        `Default variant for Pokemon ${externalId} was not found`,
      );
    }

    type EvolutionNode = {
      nodeId: string;
      id: number;
      name: string;
      image: string;
      form: {
        id: number;
        name: string;
      } | null;
    };

    type EvolutionMethod = {
      trigger: string;
      rules: ReturnType<PokemonService['mapEvolutionRule']>[];
    };

    type EvolutionConnection = {
      from: string;
      to: string;
      pokemon: EvolutionNode;
      methods: EvolutionMethod[];
    };

    const evolutionNodes = new Map<string, EvolutionNode>();

    if (pokemon.evolutionChain) {
      for (const species of pokemon.evolutionChain.species) {
        const nodeId = `${species.externalId}:default`;

        evolutionNodes.set(nodeId, {
          nodeId,
          id: species.externalId,
          name: species.name,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${species.externalId}.png`,
          form: null,
        });
      }
    }

    const groupedConnections = pokemon.evolutionChain
      ? Array.from(
          pokemon.evolutionChain.evolution
            .reduce((connections, evolution) => {
              for (const rule of evolution.rules) {
                const fromSpeciesId = evolution.fromSpecies.externalId;
                const toSpeciesId = evolution.toSpecies.externalId;

                const fromNodeId = rule.baseForm
                  ? `${fromSpeciesId}:${rule.baseForm.externalId}`
                  : `${fromSpeciesId}:default`;

                const toNodeId = rule.evolvedForm
                  ? `${toSpeciesId}:${rule.evolvedForm.externalId}`
                  : `${toSpeciesId}:default`;

                if (rule.baseForm && !evolutionNodes.has(fromNodeId)) {
                  evolutionNodes.set(fromNodeId, {
                    nodeId: fromNodeId,
                    id: fromSpeciesId,
                    name: rule.baseForm.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${rule.baseForm.externalId}.png`,
                    form: {
                      id: rule.baseForm.externalId,
                      name: rule.baseForm.name,
                    },
                  });
                }

                if (rule.evolvedForm && !evolutionNodes.has(toNodeId)) {
                  evolutionNodes.set(toNodeId, {
                    nodeId: toNodeId,
                    id: toSpeciesId,
                    name: rule.evolvedForm.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${rule.evolvedForm.externalId}.png`,
                    form: {
                      id: rule.evolvedForm.externalId,
                      name: rule.evolvedForm.name,
                    },
                  });
                }

                const connectionKey = `${fromNodeId}->${toNodeId}`;
                const mappedRule = this.mapEvolutionRule(rule);

                const existingConnection = connections.get(connectionKey);

                if (existingConnection) {
                  const existingMethod = existingConnection.methods.find(
                    (method) => method.trigger === evolution.trigger.name,
                  );

                  if (existingMethod) {
                    existingMethod.rules.push(mappedRule);
                  } else {
                    existingConnection.methods.push({
                      trigger: evolution.trigger.name,
                      rules: [mappedRule],
                    });
                  }
                } else {
                  const targetPokemon = evolutionNodes.get(toNodeId);

                  if (!targetPokemon) {
                    throw new Error(
                      `Evolution node ${toNodeId} could not be created`,
                    );
                  }

                  connections.set(connectionKey, {
                    from: fromNodeId,
                    to: toNodeId,
                    pokemon: targetPokemon,
                    methods: [
                      {
                        trigger: evolution.trigger.name,
                        rules: [mappedRule],
                      },
                    ],
                  });
                }
              }

              return connections;
            }, new Map<string, EvolutionConnection>())
            .values(),
        )
      : [];

    const evolutionChain = pokemon.evolutionChain
      ? {
          pokemon: Array.from(evolutionNodes.values()),
          connections: groupedConnections.map((connection) => ({
            from: connection.from,
            to: connection.to,
            methods: connection.methods,
          })),
        }
      : null;

    const selectedEvolutionNodeId = selectedVariant.isDefault
      ? `${pokemon.externalId}:default`
      : `${pokemon.externalId}:${selectedVariant.externalId}`;

    const nextEvolutions = groupedConnections
      .filter((connection) => connection.from === selectedEvolutionNodeId)
      .map((connection) => ({
        from: evolutionNodes.get(connection.from)!,
        pokemon: connection.pokemon,
        methods: connection.methods,
      }));

    const variants = pokemon.varieties.map((variety) => ({
      id: variety.externalId,
      name: variety.name,
      isDefault: variety.isDefault,
    }));

    return {
      id: pokemon.externalId,
      name: pokemon.name,
      generation: pokemon.generation
        ? {
            id: pokemon.generation.externalId,
            name: pokemon.generation.name,
          }
        : null,

      variants,

      selectedVariant: {
        id: selectedVariant.externalId,
        name: selectedVariant.name,
        isDefault: selectedVariant.isDefault,
      },

      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedVariant.externalId}.png`,
      types: selectedVariant.types.map((pokemonType) => pokemonType.type.name),

      abilities: selectedVariant.pokemonVarietyAbilities.map(
        (pokemonAbility) => pokemonAbility.ability.name,
      ),

      stats: selectedVariant.pokemonVarietyStats,

      evolutionChain,
      nextEvolutions,
    };
  }

  async findEncounters(externalId: number, variantExternalId?: number) {
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

  async findTypes() {
    const types = await this.prisma.type.findMany({
      orderBy: {
        externalId: 'asc',
      },
      select: {
        externalId: true,
        name: true,
      },
    });

    return types.map((type) => ({
      id: type.externalId,
      name: type.name,
    }));
  }

  async findGenerations() {
    const generations = await this.prisma.generation.findMany({
      orderBy: {
        externalId: 'asc',
      },
      select: {
        externalId: true,
        name: true,
      },
    });

    return generations.map((generation) => ({
      id: generation.externalId,
      name: generation.name,
    }));
  }
}
