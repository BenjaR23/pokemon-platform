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

export async function getFavorites(
  profileId: string,
): Promise<FavoriteEntry[]> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/favorites`,
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

  return response.json();
}

export async function addFavorite(
  profileId: string,
  pokemonId: number,
): Promise<FavoriteEntry> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/favorites/${pokemonId}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to add favorite');
  }

  return response.json();
}

export async function removeFavorite(
  profileId: string,
  pokemonId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/favorites/${pokemonId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to remove favorite');
  }
}