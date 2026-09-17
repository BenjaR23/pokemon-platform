export interface CollectionEntry {
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

export async function getCollection(
  profileId: string,
): Promise<CollectionEntry[]> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/collection`,
    {
      credentials: 'include',
    },
  );

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to load collection');
  }

  return response.json();
}

export async function addToCollection(
  profileId: string,
  pokemonId: number,
): Promise<CollectionEntry> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/collection/${pokemonId}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to add Pokemon to collection');
  }

  return response.json();
}

export async function removeFromCollection(
  profileId: string,
  pokemonId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/collection/${pokemonId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to remove Pokemon from collection');
  }
}