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
  };

  // Mock de Prisma.
  // Solo simulamos los modelos y métodos que PokemonService utiliza.
  const prismaMock = {
    generation: {
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
    // Simulamos la respuesta del endpoint /pokemon-species/1.
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

    // Simulamos la respuesta del endpoint /pokemon/1,
    // que representa la variedad concreta de Bulbasaur.
    pokeApiClientMock.getPokemon.mockResolvedValue({
      id: 1,
      name: 'bulbasaur',
      species: {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
      },
    });

    // Simulamos la generación creada o encontrada por Prisma.
    prismaMock.generation.upsert.mockResolvedValue({
      id: 'generation-uuid',
      externalId: 1,
      name: 'generation-i',
    });

    // Simulamos la cadena evolutiva creada o encontrada por Prisma.
    prismaMock.evolutionChain.upsert.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    // Simulamos PokemonSpecies ya persistido.
    prismaMock.pokemonSpecies.upsert.mockResolvedValue({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });

    // Simulamos la variedad default persistida.
    prismaMock.pokemonVariety.upsert.mockResolvedValue({
      id: 'variety-uuid',
      externalId: 1,
      name: 'bulbasaur',
      isDefault: true,
      speciesId: 'species-uuid',
    });

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

    // El servicio sigue devolviendo PokemonSpecies.
    expect(result).toEqual({
      id: 'species-uuid',
      externalId: 1,
      name: 'bulbasaur',
      generationId: 'generation-uuid',
      evolutionChainId: 'evolution-chain-uuid',
    });
  });

  it('should synchronize a Pokemon species without an evolution chain', async () => {
    // Simulamos una especie sin cadena evolutiva asociada.
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

    // Simulamos la variedad concreta devuelta por /pokemon/9999.
    pokeApiClientMock.getPokemon.mockResolvedValue({
      id: 9999,
      name: 'test-pokemon',
      species: {
        name: 'test-pokemon',
        url: 'https://pokeapi.co/api/v2/pokemon-species/9999/',
      },
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

    // Simulamos la variedad default persistida.
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
