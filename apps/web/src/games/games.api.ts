export interface GameOption {
  externalId: number;
  name: string;
  versionGroup: {
    externalId: number;
    name: string;
  };
  generation: {
    externalId: number;
    name: string;
  };
}

export async function getGames(): Promise<GameOption[]> {
  const response = await fetch(
    'http://localhost:3000/games',
  );

  if (!response.ok) {
    throw new Error(
      'Failed to fetch games',
    );
  }

  return response.json() as Promise<
    GameOption[]
  >;
}