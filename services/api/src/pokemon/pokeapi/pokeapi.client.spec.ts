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
