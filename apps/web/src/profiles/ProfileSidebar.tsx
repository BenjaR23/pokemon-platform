import { useProfile } from './useProfile';
import { useState } from 'react';
import { CreateProfileModal } from './CreateProfileModal';
import { EditObjectiveModal } from './EditObjectiveModal';
import { DeleteProfileModal } from './DeleteProfileModal';
import { RenameProfileModal } from './RenameProfileModal';

interface ProfileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSidebar({
  open,
  onClose,
}: ProfileSidebarProps) {
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [editObjectiveOpen, setEditObjectiveOpen] = useState(false);
  const [renameProfileOpen, setRenameProfileOpen] = useState(false);
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false);

  const {
    profiles,
    activeProfile,
    setActiveProfileId,
  } = useProfile();

  if (!open || !activeProfile) {
    return null;
  }

  const progress =
    activeProfile.progress;

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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <select
            value={activeProfile.id}
            onChange={(event) =>
              void setActiveProfileId(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
          >
            {profiles.map((profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profile.name}
              </option>
            ))}
          </select>

          <section className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Progress
            </h3>

            <div className="mt-3 flex items-end justify-between">
              <span className="text-lg font-medium text-zinc-100">
                {progress.captured} /{' '}
                {progress.total}
              </span>

              <span className="text-sm text-zinc-400">
                {progress.percentage}%
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
                setEditObjectiveOpen(true)
              }
              className="mt-3 text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              Edit
            </button>
          </section>

          <section className="border-t border-zinc-800 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-300">
                  Recommendation setup
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Games and acquisition preferences will be configured here.
                </p>
              </div>

              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500">
                Coming later
              </span>
            </div>
          </section>

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Profile
            </h3>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setRenameProfileOpen(true)
                }
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Rename
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteProfileOpen(true)
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
              setCreateProfileOpen(true)
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            + Create profile
          </button>
        </div>
      </aside>

      <CreateProfileModal
        open={createProfileOpen}
        onClose={() =>
          setCreateProfileOpen(false)
        }
      />

      <EditObjectiveModal
        open={editObjectiveOpen}
        onClose={() =>
          setEditObjectiveOpen(false)
        }
      />

      <RenameProfileModal
        open={renameProfileOpen}
        onClose={() =>
          setRenameProfileOpen(false)
        }
      />

      <DeleteProfileModal
        open={deleteProfileOpen}
        onClose={() =>
          setDeleteProfileOpen(false)
        }
      />
    </>
  );
}

function formatObjective(
  profile: {
    objectiveMode:
      | 'ALL'
      | 'GENERATIONS'
      | 'RANGE';
    startPokemonNumber: number | null;
    endPokemonNumber: number | null;
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
            entry.generation.externalId,
        )
        .join(', ');

    return `Generations ${generations}`;
  }

  if (
    profile.objectiveMode === 'RANGE' &&
    profile.startPokemonNumber !== null &&
    profile.endPokemonNumber !== null
  ) {
    return `#${profile.startPokemonNumber}–#${profile.endPokemonNumber}`;
  }

  return 'All Pokémon';
}