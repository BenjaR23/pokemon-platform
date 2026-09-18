export interface ProfileGame {
  externalId: number;
  name: string;
  position: number;
}

export interface ProfileGames {
  primary: ProfileGame[];
  auxiliary: ProfileGame[];
}

export interface UpdateProfileGamesInput {
  primaryGameIds: number[];
  auxiliaryGameIds: number[];
}

const API_URL = 'http://localhost:3000';

export async function getProfileGames(
  profileId: string,
): Promise<ProfileGames> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/games`,
    {
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to fetch profile games',
    );
  }

  return response.json() as Promise<
    ProfileGames
  >;
}

export async function updateProfileGames(
  profileId: string,
  input: UpdateProfileGamesInput,
): Promise<ProfileGames> {
  const response = await fetch(
    `${API_URL}/users/me/profiles/${profileId}/games`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to update profile games',
    );
  }

  return response.json() as Promise<
    ProfileGames
  >;
}