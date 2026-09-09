import { useMemo, useState } from 'react';
import type {
  PokemonEncounter,
  PokemonEncounterGame,
} from '../types/pokemon';

interface PokemonEncountersProps {
  games: PokemonEncounterGame[];
}

interface EncounterLocation {
  id: number;
  name: string;
  region: string;
  encounters: PokemonEncounter[];
}

export function PokemonEncounters({
  games,
}: PokemonEncountersProps) {
  const [selectedGameId, setSelectedGameId] = useState(
    games[0]?.id ?? 0,
  );

  const selectedGame =
    games.find((game) => game.id === selectedGameId) ?? games[0];

  const locations = useMemo(() => {
    if (!selectedGame) {
      return [];
    }

    const locationsById = new Map<number, EncounterLocation>();

    for (const encounter of selectedGame.encounters) {
      const existingLocation = locationsById.get(
        encounter.location.id,
      );

      if (existingLocation) {
        existingLocation.encounters.push(encounter);
        continue;
      }

      locationsById.set(encounter.location.id, {
        id: encounter.location.id,
        name: encounter.location.name,
        region: encounter.location.region,
        encounters: [encounter],
      });
    }

    return Array.from(locationsById.values());
  }, [selectedGame]);

  if (games.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-100">
          Encounters
        </h2>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-500">
            No encounter data available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">
            How to obtain
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Available locations and acquisition methods for this Pokemon.
          </p>

          {selectedGame && (
            <p className='mt-2 text-xs text-zinc-500'>
                Version group:{' '}
                <span className='text-zinc-300'>
                    {formatName(selectedGame.versionGroup)}
                </span>
            </p>
          )}
        </div>

        <select
          value={selectedGame?.id}
          onChange={(event) =>
            setSelectedGameId(Number(event.target.value))
          }
          className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 outline-none transition hover:border-zinc-600 focus:border-zinc-500"
        >
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {formatName(game.name)}
            </option>
          ))}
        </select>
      </div>
      {selectedGame && (
        <div className="mt-5">
          <div className="space-y-4">
            {locations.map((location) => (
              <EncounterLocationCard
                key={location.id}
                location={location}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface EncounterLocationCardProps {
  location: EncounterLocation;
}

function EncounterLocationCard({
  location,
}: EncounterLocationCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h3 className="font-medium text-zinc-100">
          {formatName(location.name)}
        </h3>

        <p className="mt-1 text-xs text-zinc-500">
          {formatName(location.region)}
        </p>
      </div>

      <div className="divide-y divide-zinc-900">
        {location.encounters.map((encounter) => (
          <div
            key={`${encounter.area.id}-${encounter.method}`}
            className="px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-sm font-medium text-zinc-200'>
                        {formatEncounterMethod(encounter.method)}
                    </span>

                    <span className='rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-500'>
                        {formatName(encounter.method)}
                    </span>
                </div>
                {encounter.area.name !== location.name && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatName(encounter.area.name)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {encounter.details.map((detail, index) => (
                <EncounterDetail
                  key={`${detail.minLevel}-${detail.maxLevel}-${detail.chance}-${index}`}
                  detail={detail}
                  method={encounter.method}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EncounterDetailProps {
  detail: PokemonEncounter['details'][number];
  method: string;
}

function EncounterDetail({
  detail,
  method,
}: EncounterDetailProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-black px-4 py-3 text-sm">
      <span className="text-zinc-300">
        {formatLevelRange(detail.minLevel, detail.maxLevel)}
      </span>

      {detail.chance !== null && showsEncounterRate(method) && (
        <span className="text-zinc-500">
          Encounter rate: {detail.chance}%
        </span>
      )}

      {detail.conditions.map((condition) => (
        <span
          key={`${condition.type}-${condition.value}`}
          className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400"
        >
          {formatName(condition.value)}
        </span>
      ))}
    </div>
  );
}

function formatLevelRange(
  minLevel: number,
  maxLevel: number,
) {
  if (minLevel === maxLevel) {
    return `Lv. ${minLevel}`;
  }

  return `Lv. ${minLevel}–${maxLevel}`;
}

function formatName(value: string) {
  return value
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

function formatEncounterMethod(method: string) {
  switch (method) {
    case 'walk':
      return 'Wild encounter';

    case 'surf':
      return 'Surfing';

    case 'old-rod':
      return 'Fishing — Old Rod';

    case 'good-rod':
      return 'Fishing — Good Rod';

    case 'super-rod':
      return 'Fishing — Super Rod';

    case 'gift':
      return 'Gift';

    case 'gift-egg':
      return 'Gift Egg';

    case 'only-one':
      return 'Static encounter';

    case 'overworld-special':
      return 'Special overworld encounter';

    case 'island-scan':
      return 'Island Scan';

    default:
      return formatName(method);
  }
}

function showsEncounterRate(method: string) {
  return [
    'walk',
    'surf',
    'old-rod',
    'good-rod',
    'super-rod',
    'rock-smash',
    'headbutt',
    'dark-grass',
    'grass-spots',
    'cave-spots',
    'bridge-spots',
    'super-rod-spots',
  ].includes(method);
}