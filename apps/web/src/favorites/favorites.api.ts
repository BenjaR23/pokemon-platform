export interface FavoriteEntry {
  id: string;
  createdAt: string;
  species: {
    externalId: number;
    name: string;
    generation: {
      externalId: number;
      name: string;
    } | null;
    varieties: {
      externalId: number;
      name: string;
    }[];
  };
}

const API_URL = 'http://localhost:3000';

export async function getFavorites(): Promise<
  FavoriteEntry[]
> {
  const response = await fetch(
    `${API_URL}/users/me/favorites`,
    {
      credentials: 'include',
    },
  );

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to load favorites');
  }

  return response.json() as Promise<FavoriteEntry[]>;
}

export async function addFavorite(
  pokemonId: number,
): Promise<FavoriteEntry> {
  const response = await fetch(
    `${API_URL}/users/me/favorites/${pokemonId}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to add favorite');
  }

  return response.json() as Promise<FavoriteEntry>;
}

export async function removeFavorite(
  pokemonId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/users/me/favorites/${pokemonId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to remove favorite');
  }
}