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

export async function getCollection(): Promise<
  CollectionEntry[]
> {
  const response = await fetch(
    `${API_URL}/users/me/collection`,
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

  return response.json() as Promise<CollectionEntry[]>;
}

export async function addToCollection(
  pokemonId: number,
): Promise<CollectionEntry> {
  const response = await fetch(
    `${API_URL}/users/me/collection/${pokemonId}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to add Pokemon to collection');
  }

  return response.json() as Promise<CollectionEntry>;
}

export async function removeFromCollection(
  pokemonId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/users/me/collection/${pokemonId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to remove Pokemon from collection',
    );
  }
}