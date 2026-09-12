import { PokemonService } from './pokemon.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferenceDataService } from './reference-data.service.js';
import { EncounterService } from './encounter.service.js';
import { createPokemonSyncContext } from './pokemon-sync-context.js';

describe('PokemonService', () => {
  let service: PokemonService;

  const createEvolutionRule = (overrides: Record<string, unknown> = {}) => ({
    minLevel: null,
    minHappiness: null,
    minBeauty: null,
    minAffection: null,
    timeOfDay: null,
    gender: null,
    relativePhysicalStats: null,
    needsOverworldRain: null,
    turnUpsideDown: null,
    nearSpecialRock: null,
    needsMultiplayer: null,
    isDefault: null,
    minMoveCount: null,
    minSteps: null,
    minDamageTaken: null,
    itemId: null,
    heldItemId: null,
    knownTypeId: null,
    locationId: null,
    partySpeciesId: null,
    partyTypeId: null,
    tradeSpeciesId: null,
    versionGroupId: null,
    regionId: null,
    baseFormId: null,
    evolvedFormId: null,
    item: null,
    heldItem: null,
    knownType: null,
    location: null,
    partySpecies: null,
    partyType: null,
    tradeSpecies: null,
    region: null,
    baseForm: null,
    evolvedForm: null,
    ...overrides,
  });

  // Mock del cliente de PokeAPI.
  // Evita realizar peticiones HTTP reales durante los tests unitarios.
  const pokeApiClientMock = {
    getPokemonSpecies: jest.fn(),
    getPokemon: jest.fn(),
    getPokemonForm: jest.fn(),
    getEvolutionChain: jest.fn(),
  };

  // Mock de Prisma.
  // Solo se simula los modelos y métodos que PokemonService utiliza.
  const prismaMock = {
    versionGroup: {
      findUnique: jest.fn(),
    },
    evolutionChain: {
      upsert: jest.fn(),
    },
    pokemonSpecies: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
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
    language: {
      upsert: jest.fn(),
    },
    pokemonSpeciesName: {
      upsert: jest.fn(),
    },
  };

  // Mock del servicio encargado de datos de referencia.
  const referenceDataServiceMock = {
    // Sinvroniza la generacion principal de una especie.
    syncGeneration: jest.fn(),

    // Sincroniza una VersionGroup requerido por una forma.
    syncVersionGroup: jest.fn(),
  };

  const encounterServiceMock = {
    syncPokemonEncounters: jest.fn(),
  };

  beforeEach(() => {
    // Reinicia llamadas, implementaciones y valores configurados
    // en los mocks para que cada test sea independiente.
    jest.resetAllMocks();

    // Creamos el servicio usando las dependencias simuladas.
    service = new PokemonService(
      pokeApiClientMock as unknown as PokeApiClient,
      prismaMock as unknown as PrismaService,
      referenceDataServiceMock as unknown as ReferenceDataService,
      encounterServiceMock as unknown as EncounterService,
    );

    prismaMock.language.upsert.mockResolvedValue({
      id: 'language-uuid',
      externalId: 7,
      name: 'es',
    });

    prismaMock.pokemonSpeciesName.upsert.mockResolvedValue({
      id: 'species-name-uuid',
      speciesId: 'species-uuid',
      languageId: 'language-uuid',
      name: 'Bulbasaur',
    });
  });

  it('should synchronize a Pokemon species', async () => {
    // Se simula la respuesta del endpoint /pokemon-species/1.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',

      names: [
        {
          name: 'Bulbasaur',
          language: {
            name: 'en',
            url: 'https://pokeapi.co/api/v2/language/9/',
          },
        },
        {
          name: 'Bulbasaur',
          language: {
            name: 'es',
            url: 'https://pokeapi.co/api/v2/language/7/',
          },
        },
      ],

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

    // Se simula la generacion ya sincronizada por ReferenceDataService.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

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

    const syncContext = createPokemonSyncContext();

    // Ejecutamos la sincronización.
    const result = await service.syncSpecies(1, syncContext);

    // Se debe solicitar la especie correcta a PokeAPI.
    expect(pokeApiClientMock.getPokemonSpecies).toHaveBeenCalledWith(1);

    // PokemonService debe delegar la sincronizacion de la generacion al servicio de datos de referencia.
    expect(referenceDataServiceMock.syncGeneration).toHaveBeenCalledWith(
      1,
      syncContext,
    );

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

    // Se comprueba que el idioma español se sincronice utlizando el ID externo obtenido desde la URL de PokeAPI.
    expect(prismaMock.language.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 7,
      },
      update: {
        name: 'es',
      },
      create: {
        externalId: 7,
        name: 'es',
      },
    });

    // Se comprueba que el nombre localizado quede asociado a la especies y al idioma español.
    expect(prismaMock.pokemonSpeciesName.upsert).toHaveBeenCalledWith({
      where: {
        speciesId_languageId: {
          speciesId: 'species-uuid',
          languageId: 'language-uuid',
        },
      },
      update: {
        name: 'Bulbasaur',
      },
      create: {
        speciesId: 'species-uuid',
        languageId: 'language-uuid',
        name: 'Bulbasaur',
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

    expect(encounterServiceMock.syncPokemonEncounters).toHaveBeenCalledWith(
      1,
      syncContext,
    );

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

  it('should synchronize all Pokemon varieties', async () => {
    // Se simula una espcie que contiene dos variedades:
    // una default y una alternativa.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 100,
      name: 'test-species',

      names: [
        {
          name: 'Bulbasaur',
          language: {
            name: 'es',
            url: 'https://pokeapi.co/api/v2/language/7/',
          },
        },
      ],

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

    // La generacion ya es responsabilidad de ReferenceDataService.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
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

    const syncContext = createPokemonSyncContext();

    // Se ejecuta la sincronizacion completa de la especie.
    await service.syncSpecies(100, syncContext);

    // Se debe consultar PokeAPI una vez por cada variedad.
    expect(pokeApiClientMock.getPokemon).toHaveBeenCalledTimes(2);
    expect(pokeApiClientMock.getPokemon).toHaveBeenNthCalledWith(1, 100);
    expect(pokeApiClientMock.getPokemon).toHaveBeenNthCalledWith(2, 101);

    expect(encounterServiceMock.syncPokemonEncounters).toHaveBeenCalledTimes(2);

    expect(encounterServiceMock.syncPokemonEncounters).toHaveBeenNthCalledWith(
      1,
      100,
      syncContext,
    );

    expect(encounterServiceMock.syncPokemonEncounters).toHaveBeenNthCalledWith(
      2,
      101,
      syncContext,
    );

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

      names: [
        {
          name: 'Bulbasaur',
          language: {
            name: 'es',
            url: 'https://pokeapi.co/api/v2/language/7/',
          },
        },
      ],

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

    // ReferenceDataService devuelve la generacion ya sincronizada.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
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

    expect(referenceDataServiceMock.syncGeneration).toHaveBeenCalledWith(
      9,
      createPokemonSyncContext(),
    );

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

  it('should synchronize a missing version group required by a Pokemon form', async () => {
    // Se simula una especie simple con una única variedad.
    // No necesitamos cadena evolutiva para este test.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',

      names: [
        {
          name: 'Bulbasaur',
          language: {
            name: 'es',
            url: 'https://pokeapi.co/api/v2/language/7/',
          },
        },
      ],

      evolution_chain: null,
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

    // Se simula la variedad concreta.
    // Dejamos types y abilities vacíos porque no forman parte
    // del comportamiento que queremos probar aquí.
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
      types: [],
      abilities: [],

      // syncStats necesita las seis estadísticas para poder continuar.
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

    // La forma pertenece al VersionGroup 15.
    pokeApiClientMock.getPokemonForm.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      form_name: '',
      is_default: true,
      is_battle_only: false,
      pokemon: {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon/1/',
      },
      version_group: {
        name: 'x-y',
        url: 'https://pokeapi.co/api/v2/version-group/15/',
      },
    });

    // La generación principal de la especie ya fue sincronizada
    // por ReferenceDataService.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // Se simula PokemonSpecies persistido.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: null,
    });

    // Se simula la variedad persistida.
    prismaMock.pokemonVariety.upsert.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
      name: 'bulbasaur',
      isDefault: true,
      speciesId: 'species-uuid',
    });

    // El VersionGroup 15 todavía NO existe en PostgreSQL.
    prismaMock.versionGroup.findUnique.mockResolvedValue(null);

    // ReferenceDataService lo sincroniza bajo demanda
    // y devuelve el registro persistido.
    referenceDataServiceMock.syncVersionGroup.mockResolvedValue({
      id: 'version-group-uuid',
      externalId: 15,
      name: 'x-y',
      generationId: 'generation-uuid',
    });

    // No nos interesa el resultado concreto de estos upserts,
    // solamente que el flujo pueda completarse.
    prismaMock.pokemonForm.upsert.mockResolvedValue({});
    prismaMock.pokemonVarietyStats.upsert.mockResolvedValue({});

    // Ejecutamos la sincronización completa de la especie.
    await service.syncSpecies(1);

    // Primero debe intentar encontrar el VersionGroup localmente.
    expect(prismaMock.versionGroup.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 15,
      },
    });

    // Como no existe, debe delegar su sincronización
    // a ReferenceDataService.
    expect(referenceDataServiceMock.syncVersionGroup).toHaveBeenCalledWith(
      15,
      undefined,
      createPokemonSyncContext(),
    );

    // Finalmente, PokemonForm debe utilizar el UUID interno
    // del VersionGroup recién sincronizado.
    expect(prismaMock.pokemonForm.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          versionGroupId: 'version-group-uuid',
        }) as object,
      }),
    );
  });

  it('should user English as fallback when Spanish name is unavailable', async () => {
    // Se simula una especies que no posee nombre en español.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',

      names: [
        {
          name: 'Bulbasaur',
          language: {
            name: 'en',
            url: 'https://pokeapi.co/api/v2/language/9/',
          },
        },
      ],

      evolution_chain: {
        url: 'https://pokeapi.co/api/v2/evolution-chain/1/',
      },

      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },

      varieties: [],
    });

    // Se simula la generacion ya persistida.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // Se simula la cadena evolutiva persistida.
    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    // Se simula la especie eprsistida.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });

    // Para este caso, Language debe representar ingles.
    prismaMock.language.upsert.mockResolvedValue({
      id: 'language-en-uuid',
      externalId: 9,
      name: 'en',
    });

    // Se ejecuta la sincronizacion.
    await service.syncSpecies(1);

    // Como español no existe, debe sincronizarse en ingles.
    expect(prismaMock.language.upsert).toHaveBeenCalledWith({
      where: {
        externalId: 9,
      },
      update: {
        name: 'en',
      },
      create: {
        externalId: 9,
        name: 'en',
      },
    });

    // El nombre localizado debe quedar asociado al idioma ingles.
    expect(prismaMock.pokemonSpeciesName.upsert).toHaveBeenCalledWith({
      where: {
        speciesId_languageId: {
          speciesId: 'species-uuid',
          languageId: 'language-en-uuid',
        },
      },
      update: {
        name: 'Bulbasaur',
      },
      create: {
        speciesId: 'species-uuid',
        languageId: 'language-en-uuid',
        name: 'Bulbasaur',
      },
    });
  });

  it('should skip localized name synchronization when Spanish and english are unavailable', async () => {
    // Se simula una especie con nombres disponibles, pero sin español ni ingles.
    pokeApiClientMock.getPokemonSpecies.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',

      names: [
        {
          name: 'フシギダネ',
          language: {
            name: 'ja-Hrkt',
            url: 'https://pokeapi.co/api/v2/language/1/',
          },
        },
      ],

      evolution_chain: {
        url: 'https://pokeapi.co/v2/evolution-chain/1/',
      },

      generation: {
        name: 'generation-i',
        url: 'https://pokeapi.co/api/v2/generation/1/',
      },

      varieties: [],
    });

    // Se simula la generacion ya persistida.
    referenceDataServiceMock.syncGeneration.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // Se simula la cadena evolutiva persistida.
    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    // Se simula la especie persistida.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });

    // Se ejecuta la sincronizacion.
    await service.syncSpecies(1);

    // No debe persistirse ningun idioma no soportado actualmente.
    expect(prismaMock.language.upsert).not.toHaveBeenCalled();

    // Tampoco debe crearse un nombre localizado.
    expect(prismaMock.pokemonSpeciesName.upsert).not.toHaveBeenCalled();
  });

  it('returns pokemon list data from the database', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([
      {
        id: 'species-uuid',
        externalId: 1,
        name: 'Bulbasaur',
        generationId: 'generation-uuid',
        evolutionChainId: 'evolution-chain-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        generation: {
          externalId: 1,
        },
        varieties: [
          {
            types: [
              {
                type: {
                  name: 'grass',
                },
              },
              {
                type: {
                  name: 'poison',
                },
              },
            ],
          },
        ],
      },
    ]);

    prismaMock.pokemonSpecies.count.mockResolvedValue(1);

    const result = await service.findAll(1, 24);

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 24,
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
    });

    expect(result).toEqual({
      items: [
        {
          id: 1,
          name: 'Bulbasaur',
          generation: 1,
          image:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          types: ['grass', 'poison'],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 24,
        total: 1,
        totalPages: 1,
      },
    });

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where: {},
    });
  });

  it('returns pokemon detail data from the database', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'Bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
      generation: {
        externalId: 1,
        name: 'generation-i',
      },
      varieties: [
        {
          externalId: 1,
          name: 'bulbasaur',
          isDefault: true,

          types: [
            {
              type: {
                name: 'grass',
              },
            },
            {
              type: {
                name: 'poison',
              },
            },
          ],
          pokemonVarietyAbilities: [
            {
              ability: {
                name: 'overgrow',
              },
            },
            {
              ability: {
                name: 'chlorophyll',
              },
            },
          ],
          pokemonVarietyStats: {
            hp: 45,
            attack: 49,
            defense: 49,
            specialAttack: 65,
            specialDefense: 65,
            speed: 45,
          },
        },
        {
          externalId: 10001,
          name: 'bulbasaur-test',
          isDefault: false,
          types: [],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: {
            hp: 50,
            attack: 50,
            defense: 50,
            specialAttack: 50,
            specialDefense: 50,
            speed: 50,
          },
        },
      ],
      evolutionChain: {
        species: [
          {
            id: 'bulbasaur-uuid',
            externalId: 1,
            name: 'Bulbasaur',
          },
          {
            id: 'ivysaur-uuid',
            externalId: 2,
            name: 'Ivysaur',
          },
          {
            id: 'venusaur-uuid',
            externalId: 3,
            name: 'Venusaur',
          },
        ],
        evolution: [
          {
            id: 'evolution-1',
            fromSpeciesId: 'bulbasaur-uuid',
            toSpeciesId: 'ivysaur-uuid',
            fromSpecies: {
              externalId: 1,
              name: 'Bulbasaur',
            },
            toSpecies: {
              externalId: 2,
              name: 'Ivysaur',
            },
            trigger: {
              name: 'level-up',
            },
            rules: [
              {
                minLevel: 16,
                minHappiness: null,
                minBeauty: null,
                minAffection: null,
                timeOfDay: null,
                gender: null,
                relativePhysicalStats: null,
                needsOverworldRain: null,
                turnUpsideDown: null,
                nearSpecialRock: null,
                needsMultiplayer: null,
                isDefault: null,
                minMoveCount: null,
                minSteps: null,
                minDamageTaken: null,
                itemId: null,
                heldItemId: null,
                knownTypeId: null,
                locationId: null,
                partySpeciesId: null,
                partyTypeId: null,
                tradeSpeciesId: null,
                versionGroupId: null,
                regionId: null,
                baseFormId: null,
                evolvedFormId: null,
                item: null,
                heldItem: null,
                knownType: null,
                location: null,
                partySpecies: null,
                partyType: null,
                tradeSpecies: null,
                region: null,
                versionGroup: null,
                baseForm: null,
                evolvedForm: null,
              },
            ],
          },
          {
            id: 'evolution-2',
            fromSpeciesId: 'ivysaur-uuid',
            toSpeciesId: 'venusaur-uuid',
            fromSpecies: {
              externalId: 2,
              name: 'Ivysaur',
            },
            toSpecies: {
              externalId: 3,
              name: 'Venusaur',
            },
            trigger: {
              name: 'level-up',
            },
            rules: [
              {
                minLevel: 32,
                minHappiness: null,
                minBeauty: null,
                minAffection: null,
                timeOfDay: null,
                gender: null,
                relativePhysicalStats: null,
                needsOverworldRain: null,
                turnUpsideDown: null,
                nearSpecialRock: null,
                needsMultiplayer: null,
                isDefault: null,
                minMoveCount: null,
                minSteps: null,
                minDamageTaken: null,
                itemId: null,
                heldItemId: null,
                knownTypeId: null,
                locationId: null,
                partySpeciesId: null,
                partyTypeId: null,
                tradeSpeciesId: null,
                versionGroupId: null,
                regionId: null,
                baseFormId: null,
                evolvedFormId: null,
                item: null,
                heldItem: null,
                knownType: null,
                location: null,
                partySpecies: null,
                partyType: null,
                tradeSpecies: null,
                region: null,
                versionGroup: null,
                baseForm: null,
                evolvedForm: null,
              },
            ],
          },
        ],
      },
    });

    const result = await service.findOne(1);

    expect(prismaMock.pokemonSpecies.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 1,
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
                  include: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(result).toEqual({
      id: 1,
      name: 'Bulbasaur',
      generation: {
        id: 1,
        name: 'generation-i',
      },
      variants: [
        {
          id: 1,
          name: 'bulbasaur',
          isDefault: true,
        },
        {
          id: 10001,
          name: 'bulbasaur-test',
          isDefault: false,
        },
      ],
      selectedVariant: {
        id: 1,
        name: 'bulbasaur',
        isDefault: true,
      },
      image:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
      types: ['grass', 'poison'],
      abilities: ['overgrow', 'chlorophyll'],
      stats: {
        hp: 45,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      },
      evolutionChain: {
        pokemon: [
          {
            nodeId: '1:default',
            id: 1,
            name: 'Bulbasaur',
            image:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
            form: null,
          },
          {
            nodeId: '2:default',
            id: 2,
            name: 'Ivysaur',
            image:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png',
            form: null,
          },
          {
            nodeId: '3:default',
            id: 3,
            name: 'Venusaur',
            image:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
            form: null,
          },
        ],
        connections: [
          {
            from: '1:default',
            to: '2:default',
            methods: [
              {
                trigger: 'level-up',
                rules: [
                  {
                    minLevel: 16,
                    minHappiness: null,
                    minBeauty: null,
                    minAffection: null,
                    timeOfDay: null,
                    gender: null,
                    relativePhysicalStats: null,
                    needsOverworldRain: null,
                    turnUpsideDown: null,
                    nearSpecialRock: null,
                    needsMultiplayer: null,
                    minMoveCount: null,
                    minSteps: null,
                    minDamageTaken: null,
                    item: null,
                    heldItem: null,
                    knownMove: null,
                    usedMove: null,
                    knownType: null,
                    location: null,
                    partySpecies: null,
                    partyType: null,
                    tradeSpecies: null,
                    region: null,
                    versionGroup: null,
                    baseForm: null,
                    evolvedForm: null,
                  },
                ],
              },
            ],
          },
          {
            from: '2:default',
            to: '3:default',
            methods: [
              {
                trigger: 'level-up',
                rules: [
                  {
                    minLevel: 32,
                    minHappiness: null,
                    minBeauty: null,
                    minAffection: null,
                    timeOfDay: null,
                    gender: null,
                    relativePhysicalStats: null,
                    needsOverworldRain: null,
                    turnUpsideDown: null,
                    nearSpecialRock: null,
                    needsMultiplayer: null,
                    minMoveCount: null,
                    minSteps: null,
                    minDamageTaken: null,
                    item: null,
                    heldItem: null,
                    knownMove: null,
                    usedMove: null,
                    knownType: null,
                    location: null,
                    partySpecies: null,
                    partyType: null,
                    tradeSpecies: null,
                    region: null,
                    versionGroup: null,
                    baseForm: null,
                    evolvedForm: null,
                  },
                ],
              },
            ],
          },
        ],
      },
      nextEvolutions: [
        {
          from: {
            nodeId: '1:default',
            id: 1,
            name: 'Bulbasaur',
            image:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
            form: null,
          },
          pokemon: {
            nodeId: '2:default',
            id: 2,
            name: 'Ivysaur',
            image:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png',

            form: null,
          },
          methods: [
            {
              trigger: 'level-up',
              rules: [
                {
                  minLevel: 16,
                  minHappiness: null,
                  minBeauty: null,
                  minAffection: null,
                  timeOfDay: null,
                  gender: null,
                  relativePhysicalStats: null,
                  needsOverworldRain: null,
                  turnUpsideDown: null,
                  nearSpecialRock: null,
                  needsMultiplayer: null,
                  minMoveCount: null,
                  minSteps: null,
                  minDamageTaken: null,
                  item: null,
                  heldItem: null,
                  knownMove: null,
                  usedMove: null,
                  knownType: null,
                  location: null,
                  partySpecies: null,
                  partyType: null,
                  tradeSpecies: null,
                  region: null,
                  versionGroup: null,
                  baseForm: null,
                  evolvedForm: null,
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('returns detail data for the selected Pokemon variant', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 19,
      name: 'rattata',

      generation: {
        externalId: 1,
        name: 'generation-i',
      },

      varieties: [
        {
          externalId: 19,
          name: 'rattata',
          isDefault: true,
          types: [
            {
              type: {
                name: 'normal',
              },
            },
          ],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: {
            hp: 30,
            attack: 56,
            defense: 35,
            specialAttack: 25,
            specialDefense: 35,
            speed: 72,
          },
        },
        {
          externalId: 10091,
          name: 'rattata-alola',
          isDefault: false,
          types: [
            {
              type: {
                name: 'dark',
              },
            },
            {
              type: {
                name: 'normal',
              },
            },
          ],
          pokemonVarietyAbilities: [
            {
              ability: {
                name: 'gluttony',
              },
            },
          ],
          pokemonVarietyStats: {
            hp: 30,
            attack: 56,
            defense: 35,
            specialAttack: 25,
            specialDefense: 35,
            speed: 72,
          },
        },
      ],

      evolutionChain: null,
    });

    const result = await service.findOne(19, 10091);

    expect(result.selectedVariant).toEqual({
      id: 10091,
      name: 'rattata-alola',
      isDefault: false,
    });

    expect(result.image).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png',
    );

    expect(result.types).toEqual(['dark', 'normal']);
    expect(result.abilities).toEqual(['gluttony']);
  });

  it('throws when the selected variant does not belong to the Pokemon species', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 19,
      name: 'rattata',

      generation: {
        externalId: 1,
        name: 'generation-i',
      },

      varieties: [
        {
          externalId: 19,
          name: 'rattata',
          isDefault: true,
          types: [],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: null,
        },
      ],

      evolutionChain: null,
    });

    await expect(service.findOne(19, 10091)).rejects.toThrow(
      'Variant with id 10091 was not found for Pokemon 19',
    );
  });

  it('returns next evolutions for the selected Pokemon variant', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 19,
      name: 'rattata',

      generation: {
        externalId: 1,
        name: 'generation-i',
      },

      varieties: [
        {
          externalId: 19,
          name: 'rattata',
          isDefault: true,
          types: [],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: null,
        },
        {
          externalId: 10091,
          name: 'rattata-alola',
          isDefault: false,
          types: [],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: null,
        },
      ],

      evolutionChain: {
        species: [
          {
            id: 'rattata-uuid',
            externalId: 19,
            name: 'rattata',
          },
          {
            id: 'raticate-uuid',
            externalId: 20,
            name: 'raticate',
          },
        ],

        evolution: [
          {
            id: 'rattata-normal-evolution',
            fromSpeciesId: 'rattata-uuid',
            toSpeciesId: 'raticate-uuid',

            fromSpecies: {
              externalId: 19,
              name: 'rattata',
            },

            toSpecies: {
              externalId: 20,
              name: 'raticate',
            },

            trigger: {
              name: 'level-up',
            },

            rules: [
              createEvolutionRule({
                minLevel: 20,
              }),
            ],
          },

          {
            id: 'rattata-alola-evolution',
            fromSpeciesId: 'rattata-uuid',
            toSpeciesId: 'raticate-uuid',

            fromSpecies: {
              externalId: 19,
              name: 'rattata',
            },

            toSpecies: {
              externalId: 20,
              name: 'raticate',
            },

            trigger: {
              name: 'level-up',
            },

            rules: [
              createEvolutionRule({
                minLevel: 20,
                timeOfDay: 'night',

                baseForm: {
                  externalId: 10091,
                  name: 'rattata-alola',
                },

                evolvedForm: {
                  externalId: 10092,
                  name: 'raticate-alola',
                },
              }),
            ],
          },
        ],
      },
    });

    const defaultResult = await service.findOne(19);
    const alolaResult = await service.findOne(19, 10091);

    expect(defaultResult.nextEvolutions).toHaveLength(1);
    expect(defaultResult.nextEvolutions[0].from.nodeId).toBe('19:default');
    expect(defaultResult.nextEvolutions[0].pokemon.nodeId).toBe('20:default');

    expect(alolaResult.nextEvolutions).toHaveLength(1);
    expect(alolaResult.nextEvolutions[0].from.nodeId).toBe('19:10091');
    expect(alolaResult.nextEvolutions[0].pokemon.nodeId).toBe('20:10092');
  });

  it('returns branching evolution connections with their evolution rules', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 133,
      name: 'Eevee',
      generation: {
        externalId: 1,
        name: 'generation-i',
      },
      varieties: [
        {
          externalId: 133,
          name: 'eevee',
          isDefault: true,
          types: [],
          pokemonVarietyAbilities: [],
          pokemonVarietyStats: null,
        },
      ],
      evolutionChain: {
        species: [
          {
            id: 'eevee-uuid',
            externalId: 133,
            name: 'Eevee',
          },
          {
            id: 'vaporeon-uuid',
            externalId: 134,
            name: 'Vaporeon',
          },
          {
            id: 'jolteon-uuid',
            externalId: 135,
            name: 'Jolteon',
          },
          {
            id: 'flareon-uuid',
            externalId: 136,
            name: 'Flareon',
          },
        ],
        evolution: [
          {
            id: 'evolution-vaporeon',
            fromSpeciesId: 'eevee-uuid',
            toSpeciesId: 'vaporeon-uuid',
            fromSpecies: {
              externalId: 133,
              name: 'Eevee',
            },
            toSpecies: {
              externalId: 134,
              name: 'Vaporeon',
            },
            trigger: {
              name: 'use-item',
            },
            rules: [
              createEvolutionRule({
                item: {
                  name: 'water-stone',
                },
              }),
            ],
          },
          {
            id: 'evolution-jolteon',
            fromSpeciesId: 'eevee-uuid',
            toSpeciesId: 'jolteon-uuid',
            fromSpecies: {
              externalId: 133,
              name: 'Eevee',
            },
            toSpecies: {
              externalId: 135,
              name: 'Jolteon',
            },
            trigger: {
              name: 'use-item',
            },
            rules: [
              createEvolutionRule({
                item: {
                  name: 'thunder-stone',
                },
              }),
            ],
          },
          {
            id: 'evolution-flareon',
            fromSpeciesId: 'eevee-uuid',
            toSpeciesId: 'flareon-uuid',
            fromSpecies: {
              externalId: 133,
              name: 'Eevee',
            },
            toSpecies: {
              externalId: 136,
              name: 'Flareon',
            },
            trigger: {
              name: 'use-item',
            },
            rules: [
              createEvolutionRule({
                item: {
                  name: 'fire-stone',
                },
              }),
            ],
          },
        ],
      },
    });

    const result = await service.findOne(133);

    expect(result.evolutionChain?.connections).toEqual([
      expect.objectContaining({
        from: '133:default',
        to: '134:default',
        methods: [
          {
            trigger: 'use-item',
            rules: [
              expect.objectContaining({
                item: 'water-stone',
              }),
            ],
          },
        ],
      }),
      expect.objectContaining({
        from: '133:default',
        to: '135:default',
        methods: [
          {
            trigger: 'use-item',
            rules: [
              expect.objectContaining({
                item: 'thunder-stone',
              }),
            ],
          },
        ],
      }),
      expect.objectContaining({
        from: '133:default',
        to: '136:default',
        methods: [
          {
            trigger: 'use-item',
            rules: [
              expect.objectContaining({
                item: 'fire-stone',
              }),
            ],
          },
        ],
      }),
    ]);

    expect(result.nextEvolutions).toHaveLength(3);
  });

  it('throws when pokemon does not exist', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999999)).rejects.toThrow(
      'Pokemon with id 999999 was not found',
    );
  });

  it('should return Pokemon encounters grouped by game acquisition', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 1,
      varieties: [
        {
          externalId: 1,
          name: 'bulbasaur',
          isDefault: true,
          pokemonAcquisitions: [
            {
              acquisitionType: {
                code: 'wild-encounter',
                name: 'Wild encounter',
              },
              game: {
                externalId: 1,
                name: 'red',
                versionGroup: {
                  name: 'red-blue',
                },
              },
              encounters: [
                {
                  locationArea: {
                    externalId: 20,
                    name: 'viridian-forest-area',
                    location: {
                      externalId: 18,
                      name: 'viridian-forest',
                      region: {
                        name: 'kanto',
                      },
                    },
                  },
                  method: {
                    name: 'walk',
                  },
                  details: [
                    {
                      minLevel: 3,
                      maxLevel: 5,
                      chance: 20,
                      conditions: [
                        {
                          conditionValue: {
                            name: 'time-day',
                            condition: {
                              name: 'time',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await service.findEncounters(1);

    expect(result).toEqual({
      pokemonId: 1,
      games: [
        {
          id: 1,
          name: 'red',
          versionGroup: 'red-blue',
          acquisitionType: {
            code: 'wild-encounter',
            name: 'Wild encounter',
          },
          encounters: [
            {
              location: {
                id: 18,
                name: 'viridian-forest',
                region: 'kanto',
              },
              area: {
                id: 20,
                name: 'viridian-forest-area',
              },
              method: 'walk',
              details: [
                {
                  minLevel: 3,
                  maxLevel: 5,
                  chance: 20,
                  conditions: [
                    {
                      type: 'time',
                      value: 'time-day',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should throw when Pokemon encounters are requested for an unknown Pokemon', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(service.findEncounters(9999)).rejects.toThrow(
      'Pokemon with id 9999 was not found',
    );
  });

  it('should return an empty games array when the Pokemon has no default variety', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 1,
      varieties: [],
    });

    await expect(service.findEncounters(1)).resolves.toEqual({
      pokemonId: 1,
      games: [],
    });
  });

  it('filters pokemon by name search', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, 'pika');

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: {
            contains: 'pika',
            mode: 'insensitive',
          },
        },
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'pika',
          mode: 'insensitive',
        },
      },
    });
  });

  it('filters pokemon by type', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, undefined, 'electric');

    const where = {
      varieties: {
        some: {
          isDefault: true,
          types: {
            some: {
              type: {
                name: 'electric',
              },
            },
          },
        },
      },
    };

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where,
    });
  });

  it('combines name search and type filter', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, 'pi', 'electric');

    const where = {
      name: {
        contains: 'pi',
        mode: 'insensitive' as const,
      },
      varieties: {
        some: {
          isDefault: true,
          types: {
            some: {
              type: {
                name: 'electric',
              },
            },
          },
        },
      },
    };

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where,
    });
  });

  it('filters pokemon by exact external id when search is numeric', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, '25');

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          externalId: 25,
        },
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where: {
        externalId: 25,
      },
    });
  });

  it('filters pokemon by generation', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, undefined, undefined, 1);

    const where = {
      generation: {
        externalId: 1,
      },
    };

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where,
    });
  });

  it('combines search, type and generation filters', async () => {
    prismaMock.pokemonSpecies.findMany.mockResolvedValue([]);
    prismaMock.pokemonSpecies.count.mockResolvedValue(0);

    await service.findAll(1, 24, 'char', 'fire', 1);

    const where = {
      name: {
        contains: 'char',
        mode: 'insensitive' as const,
      },
      varieties: {
        some: {
          isDefault: true,
          types: {
            some: {
              type: {
                name: 'fire',
              },
            },
          },
        },
      },
      generation: {
        externalId: 1,
      },
    };

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
      }),
    );

    expect(prismaMock.pokemonSpecies.count).toHaveBeenCalledWith({
      where,
    });
  });

  it('should return encounters for the selected Pokemon variant', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 19,
      varieties: [
        {
          externalId: 19,
          name: 'rattata',
          isDefault: true,
          pokemonAcquisitions: [],
        },
        {
          externalId: 10091,
          name: 'rattata-alola',
          isDefault: false,
          pokemonAcquisitions: [
            {
              acquisitionType: {
                code: 'wild-encounter',
                name: 'Wild encounter',
              },
              game: {
                externalId: 30,
                name: 'sun',
                versionGroup: {
                  name: 'sun-moon',
                },
              },
              encounters: [],
            },
          ],
        },
      ],
    });

    const result = await service.findEncounters(19, 10091);

    expect(result).toEqual({
      pokemonId: 19,
      games: [
        {
          id: 30,
          name: 'sun',
          versionGroup: 'sun-moon',
          acquisitionType: {
            code: 'wild-encounter',
            name: 'Wild encounter',
          },
          encounters: [],
        },
      ],
    });
  });

  it('should throw when the selected Pokemon variant does not belong to the species', async () => {
    prismaMock.pokemonSpecies.findUnique.mockResolvedValue({
      externalId: 25,
      varieties: [
        {
          externalId: 25,
          name: 'pikachu',
          isDefault: true,
          pokemonAcquisitions: [],
        },
      ],
    });

    await expect(service.findEncounters(25, 10091)).rejects.toThrow(
      'Variant with id 10091 was not found for Pokemon 25',
    );
  });
});
