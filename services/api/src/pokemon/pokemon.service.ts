import { Injectable } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
  async syncSpecies(externalId: number) {
    // Obtenemos la informacion de la especie desde PokeAPI.
    const species = await this.pokeApiClient.getPokemonSpecies(externalId);

    // Se extrae el externalId de la generacion y se sincroniza
    // tambien su estructura VersionGroup -> Game.
    const generationExternalId = getExternalIdFromUrl(species.generation.url);

    const generation = await this.syncGenerationData(generationExternalId);

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
      await this.syncForms(savedVariety.id, pokemon.forms);
    }

    // Por ahora se devuelve PokemonSpecies.
    return savedSpecies;
  }

  /**
   * Sincroniza una generacion junto con sus grupos de versiones
   * y los juegos pertenecientes a cada grupo.
   *
   * Flujo:
   * Generation
   * - VersionGroup
   * -- Game
   */
  private async syncGenerationData(generationExternalId: number) {
    // Se obtienen los datos completos de la generacion desde PokeAPI.
    const generationData =
      await this.pokeApiClient.getGeneration(generationExternalId);

    // Se crea o actualiza la generacion.
    const generation = await this.prisma.generation.upsert({
      where: {
        externalId: generationData.id,
      },
      update: {
        name: generationData.name,
      },
      create: {
        externalId: generationData.id,
        name: generationData.name,
      },
    });

    // Cada generacion puede contener varios grupos de versiones.
    for (const versionGroupResourse of generationData.version_groups) {
      const versionGroupExternalId = getExternalIdFromUrl(
        versionGroupResourse.url,
      );

      // Se consulta el detalle del grupo porque ahi vienen las versiones/juegos concretos.
      const VersionGroupData = await this.pokeApiClient.getVersionGroup(
        versionGroupExternalId,
      );

      // Se persiste el grupo y se relaciona con la generacion.
      const versionGroup = await this.prisma.versionGroup.upsert({
        where: {
          externalId: VersionGroupData.id,
        },
        update: {
          name: VersionGroupData.name,
          generationId: generation.id,
        },
        create: {
          externalId: VersionGroupData.id,
          name: VersionGroupData.name,
          generationId: generation.id,
        },
      });

      // Cada VersionGroup contiene uno o mas juegos concretos.
      for (const versionResource of VersionGroupData.versions) {
        const versionExternalId = getExternalIdFromUrl(versionResource.url);

        // Se consulta el endpoit /version/:id para no depender unicamente de los datos embebidos.
        const versionData =
          await this.pokeApiClient.getVersion(versionExternalId);

        // Se persiste el juego relacionandolo con su VersionGroup.
        await this.prisma.game.upsert({
          where: {
            externalId: versionData.id,
          },
          update: {
            name: versionData.name,
            versionGroupId: versionGroup.id,
          },
          create: {
            externalId: versionData.id,
            name: versionData.name,
            versionGroupId: versionGroup.id,
          },
        });
      }
    }

    return generation;
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

        // Generation -> VersionGroup ya fue sincronizado antes, asi que aqui solo se necesita buscar su UUID interno.
        const versionGroup = await this.prisma.versionGroup.findUnique({
          where: {
            externalId: versionGroupExternalId,
          },
        });

        if (!versionGroup) {
          throw new Error(
            `Versiongroup ${versionGroupExternalId} was not synchronized before PokemonForm`,
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
}
