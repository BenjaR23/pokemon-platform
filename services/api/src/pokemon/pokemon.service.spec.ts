import { PokemonService } from './pokemon.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PokemonService', () => {
  let service: PokemonService;

  // Mock del cliente de PokeAPI.
  // Evita realizar peticiones HTTP reales durante los tests unitarios.
  const pokeApiClientMock = {
    getPokemonSpecies: jest.fn(),
    getPokemon: jest.fn(),
    getPokemonForm: jest.fn(),
    getGeneration: jest.fn(),
    getVersionGroup: jest.fn(),
    getVersion: jest.fn(),
  };

  // Mock de Prisma.
  // Solo se simula los modelos y métodos que PokemonService utiliza.
  const prismaMock = {
    generation: {
      upsert: jest.fn(),
    },
    versionGroup: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    game: {
      upsert: jest.fn(),
    },
    evolutionChain: {
      upsert: jest.fn(),
    },
    pokemonSpecies: {
      upsert: jest.fn(),
    },
    pokemonVariety: {
      upsert: jest.fn(),
    },
    pokemonForm: {
      upsert: jest.fn(),
    },
    type: {
      upsert: jest.fn(),
    },
    pokemonVarietyType: {
      upsert: jest.fn(),
    },
    ability: {
      upsert: jest.fn(),
    },
    pokemonVarietyAbility: {
      upsert: jest.fn(),
    },
    pokemonVarietyStats: {
      upsert: jest.fn(),
    },
  };

  beforeEach(() => {
    // Reinicia llamadas, implementaciones y valores configurados
    // en los mocks para que cada test sea independiente.
    jest.resetAllMocks();

    // Creamos el servicio usando las dependencias simuladas.
    service = new PokemonService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
    );
  });

  it('should synchronize a Pokemon species', async () => {
    // Se simula la respuesta del endpoint /pokemon-species/1.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      evolution_chain: {
        url: 'https://pokeapi.co/api/v2/evolution-chain/1/',
      },
      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },
      varieties: [
        {
          is_default: true,
          pokemon: {
            name: 'bulbasaur',
            url: 'https://pokeapi.co/api/v2/pokemon/1/',
          },
        },
      ],
    });

    // Se simula la respuesta del endpoint /pokemon/1,
    // que representa la variedad concreta de Bulbasaur.
    pokeApiClientMock.getPokemon.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      species: {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
      },

      forms: [
        {
          name: 'bulbasaur',
          url: 'https://pokeapi.co/api/v2/pokemon-form/1/',
        },
      ],

      types: [
        {
          slot: 1,
          type: {
            name: 'grass',
            url: 'https://pokeapi.co/api/v2/type/12/',
          },
        },
        {
          slot: 2,
          type: {
            name: 'poison',
            url: 'https://pokeapi.co/api/v2/type/4/',
          },
        },
      ],

      abilities: [
        {
          is_hidden: false,
          slot: 1,
          ability: {
            name: 'overgrow',
            url: 'https://pokeapi.co/api/v2/ability/65/',
          },
        },
      ],

      stats: [
        {
          base_stat: 45,
          effort: 0,
          stat: {
            name: 'hp',
            url: 'https://pokeapi.co/api/v2/stat/1/',
          },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: {
            name: 'attack',
            url: 'https://pokeapi.co/api/v2/stat/2/',
          },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: {
            name: 'defense',
            url: 'https://pokeapi.co/api/v2/stat/3/',
          },
        },
        {
          base_stat: 65,
          effort: 1,
          stat: {
            name: 'special-attack',
            url: 'https://pokeapi.co/api/v2/stat/4/',
          },
        },
        {
          base_stat: 65,
          effort: 0,
          stat: {
            name: 'special-defense',
            url: 'https://pokeapi.co/api/v2/stat/5/',
          },
        },
        {
          base_stat: 45,
          effort: 0,
          stat: {
            name: 'speed',
            url: 'https://pokeapi.co/api/v2/stat/6/',
          },
        },
      ],
    });

    // Se simula la forma default de Bulbasaur.
    pokeApiClientMock.getPokemonForm.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      form_name: '',
      is_default: true,
      is_battle_only: false,
      pokemon: {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon/1',
      },
      version_group: {
        name: 'red-blue',
        url: 'https://pokeapi.co/api/v2/version-group/1/',
      },
    });

    // syncForms busca el UUID interno del VersionGroup que ya fue sincronizado previamente.
    prismaMock.versionGroup.findUnique.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    // Se simula la generacion completa devuelta por PokeAPI.
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

    // Se simula el grupo Red/Blue.
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

    // Cada llamada representa un juego concreto del grupo.
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

    // Se simula la generación creada o encontrada por Prisma.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    prismaMock.versionGroup.upsert.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    prismaMock.game.upsert.mockResolvedValue({});

    // Se simula la cadena evolutiva creada o encontrada por Prisma.
    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    // Se simula PokemonSpecies ya persistido.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });

    // Se simula la variedad default persistida.
    prismaMock.pokemonVariety.upsert.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
      name: 'bulbasaur',
      isDefault: true,
      speciesId: 'species-uuid',
    });

    prismaMock.type.upsert
      .mockResolvedValueOnce({
        id: 'grass-type-uuid',
        externalId: 12,
        name: 'grass',
      })
      .mockResolvedValueOnce({
        id: 'poison-type-uuid',
        externalId: 4,
        name: 'poison',
      });

    prismaMock.ability.upsert.mockResolvedValue({
      id: 'overgrow-ability-uuid',
      externalId: 65,
      name: 'overgrow',
    });

    prismaMock.pokemonVarietyType.upsert.mockResolvedValue({});
    prismaMock.pokemonVarietyAbility.upsert.mockResolvedValue({});
    prismaMock.pokemonVarietyStats.upsert.mockResolvedValue({});
    prismaMock.pokemonForm.upsert.mockResolvedValue({});

    // Ejecutamos la sincronización.
    const result = await service.syncSpecies(1);

    // Se debe solicitar la especie correcta a PokeAPI.
    expect(pokeApiClientMock.getPokemonSpecies).toHaveBeenCalledWith(1);

    // La generación se obtiene a partir del ID presente en su URL.
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

    // La cadena evolutiva debe sincronizarse cuando existe.
    expect(prismaMock.evolutionChain.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {},
      create: {
        externalId: 1,
      },
    });

    // La especie debe utilizar los UUID internos
    // de Generation y EvolutionChain.
    expect(prismaMock.pokemonSpecies.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'bulbasaur',
        generationId: 'generation-uuid',
        evolutionChainId: 'evolution-chain-uuid',
      },
      create: {
        externalId: 1,
        name: 'bulbasaur',
        generationId: 'generation-uuid',
        evolutionChainId: 'evolution-chain-uuid',
      },
    });

    // La URL de la variedad default apunta a /pokemon/1,
    // por lo que el servicio debe consultar ese recurso.
    expect(pokeApiClientMock.getPokemon).toHaveBeenCalledWith(1);

    // La variedad default debe quedar vinculada
    // al UUID interno de PokemonSpecies.
    expect(prismaMock.pokemonVariety.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'bulbasaur',
        isDefault: true,
        speciesId: 'species-uuid',
      },
      create: {
        externalId: 1,
        name: 'bulbasaur',
        isDefault: true,
        speciesId: 'species-uuid',
      },
    });

    expect(prismaMock.versionGroup.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
    });

    // Se comprueba que la forma default de Bulbasaur quede vinculada a su variedad interna.
    expect(prismaMock.pokemonForm.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 1,
      },
      update: {
        name: 'bulbasaur',
        formName: null,
        isDefault: true,
        isBattleOnly: false,
        isMega: false,
        isGigantamax: false,
        varietyId: 'variety-uuid',
        versionGroupId: 'version-group-uuid',
      },
      create: {
        externalId: 1,
        name: 'bulbasaur',
        formName: null,
        isDefault: true,
        isBattleOnly: false,
        isMega: false,
        isGigantamax: false,
        varietyId: 'variety-uuid',
        versionGroupId: 'version-group-uuid',
      },
    });

    expect(pokeApiClientMock.getPokemonForm).toHaveBeenCalledWith(1);

    // Se comprueba que el tipo grass haya sido sincronizado.
    expect(prismaMock.type.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 12,
      },
      update: {
        name: 'grass',
      },
      create: {
        externalId: 12,
        name: 'grass',
      },
    });

    // Se comprueba tambien que poison haya sido sincronizado.
    expect(prismaMock.type.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 4,
      },
      update: {
        name: 'poison',
      },
      create: {
        externalId: 4,
        name: 'poison',
      },
    });

    // Grass ocupa el slot 1 de Bulbasaru.
    expect(prismaMock.pokemonVarietyType.upsert).toHaveBeenCalledWith({
      where: {
        varietyId_slot: {
          varietyId: 'variety-uuid',
          slot: 1,
        },
      },
      update: {
        typeId: 'grass-type-uuid',
      },
      create: {
        varietyId: 'variety-uuid',
        typeId: 'grass-type-uuid',
        slot: 1,
      },
    });

    // Poison ocupa el slot 2 de Bulbasaur.
    expect(prismaMock.pokemonVarietyType.upsert).toHaveBeenCalledWith({
      where: {
        varietyId_slot: {
          varietyId: 'variety-uuid',
          slot: 2,
        },
      },
      update: {
        typeId: 'poison-type-uuid',
      },
      create: {
        varietyId: 'variety-uuid',
        typeId: 'poison-type-uuid',
        slot: 2,
      },
    });

    // Se comprueba que overgrow haya sido sincronizada.
    expect(prismaMock.ability.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 65,
      },
      update: {
        name: 'overgrow',
      },
      create: {
        externalId: 65,
        name: 'overgrow',
      },
    });

    // Se comprueba la relacion entre Bulbasaur y Overgrow.
    expect(prismaMock.pokemonVarietyAbility.upsert).toHaveBeenCalledWith({
      where: {
        varietyId_abilityId: {
          varietyId: 'variety-uuid',
          abilityId: 'overgrow-ability-uuid',
        },
      },
      update: {},
      create: {
        varietyId: 'variety-uuid',
        abilityId: 'overgrow-ability-uuid',
      },
    });

    /**
     * PokeAPI entrega las stats como un array.
     * PokemonService debe transformarlas a las coolumnas
     * definidas en PokemonVarietyStats.
     */
    expect(prismaMock.pokemonVarietyStats.upsert).toHaveBeenCalledWith({
      where: {
        varietyId: 'variety-uuid',
      },
      update: {
        hp: 45,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      },
      create: {
        varietyId: 'variety-uuid',
        hp: 45,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      },
    });

    // El servicio sigue devolviendo PokemonSpecies.
    expect(result).toEqual({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });
  });

  it('should synchronize generation, version groups and games', async () => {
    // Se simula una especie minima que pertenece a Generation I.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      evolution_chain: null,
      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },
      varieties: [],
    });

    // Se simula la informacion completa de la generacion.
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

    // Se simula el VersionGroup red-blue.
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

    // Cada llamada corresponde a uno de los juegos del grupo.
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

    // Se simula generation

    // Se simula Generation persistida.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    prismaMock.versionGroup.upsert.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 1,
      name: 'red-blue',
      generationId: 'generation-uuid',
    });

    // El retorno concreto de Game no se usa despues, asi que basta con resolver correctamente.
    prismaMock.game.upsert.mockResolvedValue({});

    // syncSpecies necesita persistir PokemonSpecies al final.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: null,
    });

    // Se ejecuta la sincronizacion.
    await service.syncSpecies(1);

    // Se debe solicitar la generacion correcta.
    expect(pokeApiClientMock.getGeneration).toHaveBeenCalledWith(1);

    // Generation debe persistirse.
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

    // El VersionGroup debe obtenerse mediante su externalId.
    expect(pokeApiClientMock.getVersionGroup).toHaveBeenCalledWith(1);

    // Deben consultarse las dos versiones.
    expect(pokeApiClientMock.getVersion).toHaveBeenCalledTimes(2);
    expect(pokeApiClientMock.getVersion).toHaveBeenNthCalledWith(1, 1);
    expect(pokeApiClientMock.getVersion).toHaveBeenNthCalledWith(2, 2);

    // Red debe persistirse relacionado con red-blue.
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

    // Blue tambien debe persistirse en el mismo Versiongroup.
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
  });

  it('should synchronize all Pokemon varieties', async () => {
    // Se simula una espcie que contiene dos variedades:
    // una default y una alternativa.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 100,
      name: 'test-species',
      evolution_chain: {
        url: 'https://pokeapi.co/api/v2/evolution-chain/100/',
      },
      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },
      varieties: [
        {
          is_default: true,
          pokemon: {
            name: 'test-default',
            url: 'https://pokeapi.co/api/v2/pokemon/100/',
          },
        },
        {
          is_default: false,
          pokemon: {
            name: 'test-alternate',
            url: 'https://pokeapi.co/api/v2/pokemon/101/',
          },
        },
      ],
    });

    /**
     * Este test no necesita comprobar Versiongroups ni Games.
     * Solo necesitamos que syncGenerationData pueda resolver la generacion.
     */
    pokeApiClientMock.getGeneration.mockResolvedValue({
      id: 1,
      name: 'generation-i',
      version_groups: [],
    });

    /**
     * Se simula las dos respuestas del endpoint /pokemon/:id.
     * La primera llamada corresponde a la variedad default.
     * La segunda corresponde a la variedad alternativa.
     */
    pokeApiClientMock.getPokemon
      .mockResolvedValueOnce({
        id: 100,
        name: 'test-default',
        species: {
          name: 'test-species',
          url: 'https://pokeapi.co/api/v2/pokemon-species/100/',
        },
        forms: [],
        types: [],
        abilities: [],
        stats: [
          {
            base_stat: 50,
            effort: 0,
            stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' },
          },
          {
            base_stat: 50,
            effort: 0,
            stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' },
          },
          {
            base_stat: 50,
            effort: 0,
            stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' },
          },
          {
            base_stat: 50,
            effort: 0,
            stat: {
              name: 'special-attack',
              url: 'https://pokeapi.co/api/v2/stat/4/',
            },
          },
          {
            base_stat: 50,
            effort: 0,
            stat: {
              name: 'special-defense',
              url: 'https://pokeapi.co/api/v2/stat/5/',
            },
          },
          {
            base_stat: 50,
            effort: 0,
            stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 101,
        name: 'test-alternate',
        species: {
          name: 'test-species',
          url: 'https://pokeapi.co/api/v2/pokemon-species/100/',
        },
        forms: [],
        types: [],
        abilities: [],
        stats: [
          {
            base_stat: 60,
            effort: 0,
            stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' },
          },
          {
            base_stat: 60,
            effort: 0,
            stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' },
          },
          {
            base_stat: 60,
            effort: 0,
            stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' },
          },
          {
            base_stat: 60,
            effort: 0,
            stat: {
              name: 'special-attack',
              url: 'https://pokeapi.co/api/v2/stat/4/',
            },
          },
          {
            base_stat: 60,
            effort: 0,
            stat: {
              name: 'special-defense',
              url: 'https://pokeapi.co/api/v2/stat/5/',
            },
          },
          {
            base_stat: 60,
            effort: 0,
            stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' },
          },
        ],
      });

    // Se simulan las entidades comunes a ambas variedades.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 100,
    });

    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 100,
      name: 'test-species',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });

    // Cada llamada a pokemonVariety.upsert representa una variedad distinta persistida en PostgreSQL.
    prismaMock.pokemonVariety.upsert
      .mockResolvedValueOnce({
        id: 'default-variety-uuid',
        externalId: 100,
        name: 'test-default',
        isDefault: true,
        speciesId: 'species-uuid',
      })
      .mockResolvedValueOnce({
        id: 'alternate-variety-uuid',
        externalId: 101,
        name: 'test-alternate',
        isDefault: false,
        speciesId: 'species-uuid',
      });

    // syncStats se ejecutara una vez por cada variedad.
    prismaMock.pokemonVarietyStats.upsert.mockResolvedValue({});

    // Se ejecuta la sincronizacion completa de la especie.
    await service.syncSpecies(100);

    // Se debe consultar PokeAPI una vez por cada variedad.
    expect(pokeApiClientMock.getPokemon).toHaveBeenCalledTimes(2);
    expect(pokeApiClientMock.getPokemon).toHaveBeenNthCalledWith(1, 100);
    expect(pokeApiClientMock.getPokemon).toHaveBeenNthCalledWith(2, 101);

    // La variedad default debe persistirse correctamente.
    expect(prismaMock.pokemonVariety.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 100,
      },
      update: {
        name: 'test-default',
        isDefault: true,
        speciesId: 'species-uuid',
      },
      create: {
        externalId: 100,
        name: 'test-default',
        isDefault: true,
        speciesId: 'species-uuid',
      },
    });

    // La variedad alternativa tambien debe persistirse.
    expect(prismaMock.pokemonVariety.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 101,
      },
      update: {
        name: 'test-alternate',
        isDefault: false,
        speciesId: 'species-uuid',
      },
      create: {
        externalId: 101,
        name: 'test-alternate',
        isDefault: false,
        speciesId: 'species-uuid',
      },
    });

    // Las stats deben sincronizarse independientemente para las dos variedades.
    expect(prismaMock.pokemonVarietyStats.upsert).toHaveBeenCalledTimes(2);

    expect(prismaMock.pokemonVarietyStats.upsert).toHaveBeenCalledWith({
      where: {
        varietyId: 'default-variety-uuid',
      },
      update: {
        hp: 50,
        attack: 50,
        defense: 50,
        specialAttack: 50,
        specialDefense: 50,
        speed: 50,
      },
      create: {
        varietyId: 'default-variety-uuid',
        hp: 50,
        attack: 50,
        defense: 50,
        specialAttack: 50,
        specialDefense: 50,
        speed: 50,
      },
    });

    expect(prismaMock.pokemonVarietyStats.upsert).toHaveBeenCalledWith({
      where: {
        varietyId: 'alternate-variety-uuid',
      },
      update: {
        hp: 60,
        attack: 60,
        defense: 60,
        specialAttack: 60,
        specialDefense: 60,
        speed: 60,
      },
      create: {
        varietyId: 'alternate-variety-uuid',
        hp: 60,
        attack: 60,
        defense: 60,
        specialAttack: 60,
        specialDefense: 60,
        speed: 60,
      },
    });
  });

  it('should synchronize a Pokemon species without an evolution chain', async () => {
    // Se simula una especie sin cadena evolutiva asociada.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 9999,
      name: 'test-pokemon',
      evolution_chain: null,
      generation: {
        name: 'generation-ix',
        url: 'https://pokeapi.co/api/v2/generation/9/',
      },
      varieties: [
        {
          is_default: true,
          pokemon: {
            name: 'test-pokemon',
            url: 'https://pokeapi.co/api/v2/pokemon/9999/',
          },
        },
      ],
    });

    /**
     * Este test se centra en evolution_chain === null,
     * por lo que no se necesita sincronizar grupos de versiones.
     */
    pokeApiClientMock.getGeneration.mockResolvedValue({
      id: 9,
      name: 'generation-ix',
      version_groups: [],
    });

    // Se simula la variedad concreta devuelta por /pokemon/9999.
    // Incluimos types, abilities y stats porque syncSpecies
    // ahora sincroniza también esos datos.
    pokeApiClientMock.getPokemon.mockResolvedValue({
      id: 9999,
      name: 'test-pokemon',
      species: {
        name: 'test-pokemon',
        url: 'https://pokeapi.co/api/v2/pokemon-species/9999/',
      },

      forms: [],

      // Para este test no nos interesa probar tipos,
      // por lo que usamos un array vacío válido.
      types: [],

      // Lo mismo para habilidades.
      abilities: [],

      // Stats sí deben contener las seis estadísticas,
      // porque syncStats valida que estén completas.
      stats: [
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'hp',
            url: 'https://pokeapi.co/api/v2/stat/1/',
          },
        },
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'attack',
            url: 'https://pokeapi.co/api/v2/stat/2/',
          },
        },
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'defense',
            url: 'https://pokeapi.co/api/v2/stat/3/',
          },
        },
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'special-attack',
            url: 'https://pokeapi.co/api/v2/stat/4/',
          },
        },
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'special-defense',
            url: 'https://pokeapi.co/api/v2/stat/5/',
          },
        },
        {
          base_stat: 50,
          effort: 0,
          stat: {
            name: 'speed',
            url: 'https://pokeapi.co/api/v2/stat/6/',
          },
        },
      ],
    });

    // La generación debe sincronizarse normalmente.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 9,
      name: 'generation-ix',
    });

    // PokemonSpecies debe quedar con evolutionChainId en null.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 9999,
      name: 'test-pokemon',
      generationId: 'generation-uuid',
      evolutionChainId: null,
    });

    // Se simula la variedad default persistida.
    prismaMock.pokemonVariety.upsert.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 9999,
      name: 'test-pokemon',
      isDefault: true,
      speciesId: 'species-uuid',
    });

    // Ejecutamos la sincronización.
    const result = await service.syncSpecies(9999);

    // La generación debe seguir sincronizándose normalmente.
    expect(prismaMock.generation.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 9,
      },
      update: {
        name: 'generation-ix',
      },
      create: {
        externalId: 9,
        name: 'generation-ix',
      },
    });

    // Como PokeAPI no entregó una cadena evolutiva,
    // no debe realizarse ningún upsert sobre EvolutionChain.
    expect(prismaMock.evolutionChain.upsert).not.toHaveBeenCalled();

    // La especie debe persistirse explícitamente con null.
    expect(prismaMock.pokemonSpecies.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 9999,
      },
      update: {
        name: 'test-pokemon',
        generationId: 'generation-uuid',
        evolutionChainId: null,
      },
      create: {
        externalId: 9999,
        name: 'test-pokemon',
        generationId: 'generation-uuid',
        evolutionChainId: null,
      },
    });

    // La variedad default también debe sincronizarse.
    expect(pokeApiClientMock.getPokemon).toHaveBeenCalledWith(9999);

    expect(prismaMock.pokemonVariety.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 9999,
      },
      update: {
        name: 'test-pokemon',
        isDefault: true,
        speciesId: 'species-uuid',
      },
      create: {
        externalId: 9999,
        name: 'test-pokemon',
        isDefault: true,
        speciesId: 'species-uuid',
      },
    });

    // El servicio debe devolver el registro generado por Prisma.
    expect(result).toEqual({
      id: 'species-uuid',
      externalId: 9999,
      name: 'test-pokemon',
      generationId: 'generation-uuid',
      evolutionChainId: null,
    });
  });
});
