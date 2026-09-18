import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getRecommendationPlan,
  type RecommendationConfiguredGame,
} from '../recommendations/recommendations.api';

import { CreateProfileModal } from './CreateProfileModal';
import { DeleteProfileModal } from './DeleteProfileModal';
import { EditObjectiveModal } from './EditObjectiveModal';
import { RenameProfileModal } from './RenameProfileModal';
import { useProfile } from './useProfile';

interface ProfileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSidebar({
  open,
  onClose,
}: ProfileSidebarProps) {
  const navigate = useNavigate();

  const [
    createProfileOpen,
    setCreateProfileOpen,
  ] = useState(false);

  const [
    editObjectiveOpen,
    setEditObjectiveOpen,
  ] = useState(false);

  const [
    renameProfileOpen,
    setRenameProfileOpen,
  ] = useState(false);

  const [
    deleteProfileOpen,
    setDeleteProfileOpen,
  ] = useState(false);

  const [
    configuredGames,
    setConfiguredGames,
  ] = useState<
    RecommendationConfiguredGame[]
  >([]);

  const [
    gamesLoading,
    setGamesLoading,
  ] = useState(false);

  const {
    profiles,
    activeProfile,
    setActiveProfileId,
  } = useProfile();

  const activeProfileId =
    activeProfile?.id ?? null;

  useEffect(() => {
    if (
      !open ||
      !activeProfileId
    ) {
      return;
    }

    let cancelled = false;

    async function loadConfiguredGames() {
      try {
        setGamesLoading(true);

        const plan =
          await getRecommendationPlan(
            activeProfileId!,
          );

        if (!cancelled) {
          setConfiguredGames(
            plan.configuredGames,
          );
        }
      } catch {
        if (!cancelled) {
          setConfiguredGames([]);
        }
      } finally {
        if (!cancelled) {
          setGamesLoading(false);
        }
      }
    }

    void loadConfiguredGames();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    activeProfileId,
  ]);

  if (
    !open ||
    !activeProfile
  ) {
    return null;
  }

  const progress =
    activeProfile.progress;

  const primaryGames =
    configuredGames.filter(
      (game) =>
        game.role ===
        'PRIMARY',
    );

  const auxiliaryGames =
    configuredGames.filter(
      (game) =>
        game.role ===
        'AUXILIARY',
    );

  function handleOpenRecommendations() {
    onClose();

    navigate(
      '/recommendations',
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close profile panel"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <h2 className="text-lg font-semibold text-zinc-100">
            Profile
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile panel"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <select
            value={
              activeProfile.id
            }
            onChange={(
              event,
            ) =>
              void setActiveProfileId(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
          >
            {profiles.map(
              (profile) => (
                <option
                  key={
                    profile.id
                  }
                  value={
                    profile.id
                  }
                >
                  {
                    profile.name
                  }
                </option>
              ),
            )}
          </select>

          <section className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Progress
            </h3>

            <div className="mt-3 flex items-end justify-between">
              <span className="text-lg font-medium text-zinc-100">
                {
                  progress.captured
                }{' '}
                /{' '}
                {
                  progress.total
                }
              </span>

              <span className="text-sm text-zinc-400">
                {
                  progress.percentage
                }
                %
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${progress.percentage}%`,
                }}
              />
            </div>
          </section>

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Objective
            </h3>

            <p className="mt-3 text-sm text-zinc-200">
              {formatObjective(
                activeProfile,
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                setEditObjectiveOpen(
                  true,
                )
              }
              className="mt-3 text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              Edit
            </button>
          </section>

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Recommendation setup
            </h3>

            {gamesLoading ? (
              <p className="mt-3 text-sm text-zinc-500">
                Loading games...
              </p>
            ) : configuredGames.length ===
              0 ? (
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                No games
                configured.
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                {primaryGames.length >
                  0 && (
                  <GameGroup
                    label="Primary"
                    games={
                      primaryGames
                    }
                  />
                )}

                {auxiliaryGames.length >
                  0 && (
                  <GameGroup
                    label="Auxiliary"
                    games={
                      auxiliaryGames
                    }
                  />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={
                handleOpenRecommendations
              }
              className="mt-5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              Configure
            </button>
          </section>

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Profile
            </h3>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setRenameProfileOpen(
                    true,
                  )
                }
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Rename
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteProfileOpen(
                    true,
                  )
                }
                className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 transition hover:border-red-700 hover:bg-red-950/30"
              >
                Delete
              </button>
            </div>
          </section>
        </div>

        <div className="border-t border-zinc-800 p-5">
          <button
            type="button"
            onClick={() =>
              setCreateProfileOpen(
                true,
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            + Create profile
          </button>
        </div>
      </aside>

      <CreateProfileModal
        open={
          createProfileOpen
        }
        onClose={() =>
          setCreateProfileOpen(
            false,
          )
        }
      />

      <EditObjectiveModal
        open={
          editObjectiveOpen
        }
        onClose={() =>
          setEditObjectiveOpen(
            false,
          )
        }
      />

      <RenameProfileModal
        open={
          renameProfileOpen
        }
        onClose={() =>
          setRenameProfileOpen(
            false,
          )
        }
      />

      <DeleteProfileModal
        open={
          deleteProfileOpen
        }
        onClose={() =>
          setDeleteProfileOpen(
            false,
          )
        }
      />
    </>
  );
}

interface GameGroupProps {
  label: string;

  games:
    RecommendationConfiguredGame[];
}

function GameGroup({
  label,
  games,
}: GameGroupProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <div className="mt-2 space-y-2">
        {games.map(
          (
            game,
            index,
          ) => (
            <div
              key={
                game.externalId
              }
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-black px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-xs font-medium text-zinc-500">
                {index + 1}
              </span>

              <span className="min-w-0 truncate text-sm text-zinc-300">
                {formatName(
                  game.name,
                )}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function formatObjective(
  profile: {
    objectiveMode:
      | 'ALL'
      | 'GENERATIONS'
      | 'RANGE';

    startPokemonNumber:
      | number
      | null;

    endPokemonNumber:
      | number
      | null;

    generations: Array<{
      generation: {
        externalId: number;
      };
    }>;
  },
) {
  if (
    profile.objectiveMode ===
    'GENERATIONS'
  ) {
    const generations =
      profile.generations
        .map(
          (entry) =>
            entry.generation
              .externalId,
        )
        .join(', ');

    return `Generations ${generations}`;
  }

  if (
    profile.objectiveMode ===
      'RANGE' &&
    profile.startPokemonNumber !==
      null &&
    profile.endPokemonNumber !==
      null
  ) {
    return `#${profile.startPokemonNumber}–#${profile.endPokemonNumber}`;
  }

  return 'All Pokémon';
}

function formatName(
  value: string,
) {
  return value
    .split('-')
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}