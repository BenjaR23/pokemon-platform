export type CollectionObjectiveMode =
  | 'ALL'
  | 'GENERATIONS'
  | 'RANGE';

export interface ProfileGeneration {
  generation: {
    externalId: number;
    name: string;
  };
}

export interface CollectionProfile {
  id: string;
  name: string;
  objectiveMode: CollectionObjectiveMode;
  startPokemonNumber: number | null;
  endPokemonNumber: number | null;
  generations: ProfileGeneration[];
  games: Array<{
    game: {
      externalId: number;
      name: string;
    };
  }>;
  preferences: {
    includeForms: boolean;
    includeVariants: boolean;
    includeEventOnly: boolean;
    includeUnavailable: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionProfileDetail
  extends CollectionProfile {
  progress: {
    captured: number;
    total: number;
    percentage: number;
  };
}

export interface CreateProfileInput {
  name: string;
  objectiveMode?: CollectionObjectiveMode;
  generationIds?: number[];
  startPokemonNumber?: number;
  endPokemonNumber?: number;
}

export interface UpdateProfileInput {
  name?: string;
  objectiveMode?: CollectionObjectiveMode;
  generationIds?: number[];
  startPokemonNumber?: number;
  endPokemonNumber?: number;
}

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export async function getProfiles(): Promise<
  CollectionProfile[]
> {
  const response = await fetch(
    `${API_URL}/users/me/profiles`,
    {
      credentials: 'include',
    },
  );

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to load profiles');
  }

  return response.json();
}

export async function getProfile(
  profileId: string,
): Promise<CollectionProfileDetail> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}`,
    {
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to load profile');
  }

  return response.json();
}

export async function createProfile(
  input: CreateProfileInput,
): Promise<CollectionProfile> {
  const response = await fetch(
    `${API_URL}/users/me/profiles`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create profile');
  }

  return response.json();
}

export async function updateProfile(
  profileId: string,
  input: UpdateProfileInput,
): Promise<CollectionProfile> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}

export async function deleteProfile(
  profileId: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to delete profile');
  }
}