import { PokeApiClient } from './client.js';

describe('PokeApiClient', () => {
  let client: PokeApiClient;

  beforeEach(() => {
    client = new PokeApiClient();
  });

  it('should fetch a Pokemon species', async () => {
    const response = {
      id: 1,
      name: 'bulbasaur',
      evolution_chain: {
        url: 'https://pokeapi.co/api/v2/evolution-chain/1/',
      },
      generation: {
        name: 'generation-1',
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
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await expect(client.getPokemonSpecies(1)).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon-species/1',
    );
  });

  it('should fetch a Pokemon variety', async () => {
    // Se simula la respuesta minima del endpoint /pokemon/1.
    const response = {
      id: 1,
      name: 'bulbasaur',
      species: {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon-species/1/1',
      },
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
          effort: 0,
          stat: {
            name: 'special_attack',
            url: 'https://pokeapi.co/api/v2/stat/4/',
          },
        },
        {
          base_stat: 65,
          effort: 0,
          stat: {
            name: 'special_defense',
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
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await expect(client.getPokemon(1)).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon/1',
    );
  });
});
