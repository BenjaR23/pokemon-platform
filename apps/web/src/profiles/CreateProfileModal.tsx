import {
  useState,
  type FormEvent,
} from 'react';
import type { CollectionObjectiveMode } from './profiles.api';
import { useProfile } from './useProfile';

interface CreateProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const GENERATIONS = [
  { id: 1, label: 'Generation I' },
  { id: 2, label: 'Generation II' },
  { id: 3, label: 'Generation III' },
  { id: 4, label: 'Generation IV' },
  { id: 5, label: 'Generation V' },
  { id: 6, label: 'Generation VI' },
  { id: 7, label: 'Generation VII' },
  { id: 8, label: 'Generation VIII' },
  { id: 9, label: 'Generation IX' },
];

export function CreateProfileModal({
  open,
  onClose,
}: CreateProfileModalProps) {
  const { createProfile } = useProfile();

  const [name, setName] = useState('');

  const [
    objectiveMode,
    setObjectiveMode,
  ] =
    useState<CollectionObjectiveMode>(
      'ALL',
    );

  const [
    selectedGenerations,
    setSelectedGenerations,
  ] = useState<number[]>([]);

  const [
    startPokemonNumber,
    setStartPokemonNumber,
  ] = useState('');

  const [
    endPokemonNumber,
    setEndPokemonNumber,
  ] = useState('');

  const [
    recommendationSetup,
    setRecommendationSetup,
  ] = useState<'configure' | 'skip'>(
    'skip',
  );

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  if (!open) {
    return null;
  }

  function resetForm() {
    setName('');
    setObjectiveMode('ALL');
    setSelectedGenerations([]);
    setStartPokemonNumber('');
    setEndPokemonNumber('');
    setRecommendationSetup('skip');
    setError(null);
  }

  function handleClose() {
    if (creating) {
      return;
    }

    resetForm();
    onClose();
  }

  function toggleGeneration(
    generationId: number,
  ) {
    setSelectedGenerations(
      (current) =>
        current.includes(generationId)
          ? current.filter(
              (id) =>
                id !== generationId,
            )
          : [
              ...current,
              generationId,
            ].sort((a, b) => a - b),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        'Profile name is required.',
      );
      return;
    }

    if (
      objectiveMode ===
        'GENERATIONS' &&
      selectedGenerations.length === 0
    ) {
      setError(
        'Select at least one generation.',
      );
      return;
    }

    let start: number | undefined;
    let end: number | undefined;

    if (objectiveMode === 'RANGE') {
      start = Number(
        startPokemonNumber,
      );

      end = Number(endPokemonNumber);

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1
      ) {
        setError(
          'Enter a valid Pokémon number range.',
        );
        return;
      }

      if (start > end) {
        setError(
          'The starting number cannot be greater than the ending number.',
        );
        return;
      }
    }

    setCreating(true);

    try {
      if (objectiveMode === 'ALL') {
        await createProfile({
          name: trimmedName,
          objectiveMode: 'ALL',
        });
      }

      if (
        objectiveMode ===
        'GENERATIONS'
      ) {
        await createProfile({
          name: trimmedName,
          objectiveMode:
            'GENERATIONS',
          generationIds:
            selectedGenerations,
        });
      }

      if (objectiveMode === 'RANGE') {
        await createProfile({
          name: trimmedName,
          objectiveMode: 'RANGE',
          startPokemonNumber: start,
          endPokemonNumber: end,
        });
      }

      resetForm();
      onClose();
    } catch {
      setError(
        'Could not create profile.',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              Create Profile
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create an independent
              collection, favorites and
              completion goal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) =>
            void handleSubmit(event)
          }
          className="space-y-8 p-6"
        >
          <section>
            <label
              htmlFor="profile-name"
              className="text-sm font-medium text-zinc-300"
            >
              Name
            </label>

            <input
              id="profile-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={50}
              placeholder="National Dex"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </section>

          <section>
            <div>
              <h3 className="text-sm font-medium text-zinc-300">
                Objective
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Optional. All Pokémon is
                used by default.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <ObjectiveOption
                checked={
                  objectiveMode ===
                  'ALL'
                }
                label="All Pokémon"
                description="Complete the full Pokédex."
                onChange={() =>
                  setObjectiveMode('ALL')
                }
              />

              <ObjectiveOption
                checked={
                  objectiveMode ===
                  'GENERATIONS'
                }
                label="Generations"
                description="Choose one or more generations."
                onChange={() =>
                  setObjectiveMode(
                    'GENERATIONS',
                  )
                }
              />

              <ObjectiveOption
                checked={
                  objectiveMode ===
                  'RANGE'
                }
                label="Number range"
                description="Choose a Pokédex number interval."
                onChange={() =>
                  setObjectiveMode(
                    'RANGE',
                  )
                }
              />
            </div>

            {objectiveMode ===
              'GENERATIONS' && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GENERATIONS.map(
                  (generation) => {
                    const checked =
                      selectedGenerations.includes(
                        generation.id,
                      );

                    return (
                      <label
                        key={
                          generation.id
                        }
                        className={
                          checked
                            ? 'flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2.5 text-sm text-emerald-200'
                            : 'flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700'
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          onChange={() =>
                            toggleGeneration(
                              generation.id,
                            )
                          }
                        />

                        {
                          generation.label
                        }
                      </label>
                    );
                  },
                )}
              </div>
            )}

            {objectiveMode ===
              'RANGE' && (
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-range-start"
                    className="text-xs text-zinc-500"
                  >
                    From
                  </label>

                  <input
                    id="profile-range-start"
                    type="number"
                    min="1"
                    value={
                      startPokemonNumber
                    }
                    onChange={(event) =>
                      setStartPokemonNumber(
                        event.target
                          .value,
                      )
                    }
                    placeholder="1"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-range-end"
                    className="text-xs text-zinc-500"
                  >
                    To
                  </label>

                  <input
                    id="profile-range-end"
                    type="number"
                    min="1"
                    value={
                      endPokemonNumber
                    }
                    onChange={(event) =>
                      setEndPokemonNumber(
                        event.target
                          .value,
                      )
                    }
                    placeholder="151"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-medium text-zinc-300">
              Recommendations
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              Optional. Games and
              acquisition preferences can
              be configured now or later
              from the profile panel.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setRecommendationSetup(
                    'configure',
                  )
                }
                className={
                  recommendationSetup ===
                  'configure'
                    ? 'rounded-lg border border-zinc-500 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100'
                    : 'rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700'
                }
              >
                Configure now
              </button>

              <button
                type="button"
                onClick={() =>
                  setRecommendationSetup(
                    'skip',
                  )
                }
                className={
                  recommendationSetup ===
                  'skip'
                    ? 'rounded-lg border border-zinc-500 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100'
                    : 'rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700'
                }
              >
                Skip
              </button>
            </div>

            {recommendationSetup ===
              'configure' && (
              <p className="mt-3 rounded-lg border border-zinc-800 bg-black p-3 text-xs text-zinc-500">
                The profile will be created
                first. Game and preference
                configuration will be
                connected in the next
                recommendation step.
              </p>
            )}
          </section>

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? 'Creating...'
                : 'Create profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ObjectiveOptionProps {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}

function ObjectiveOption({
  checked,
  label,
  description,
  onChange,
}: ObjectiveOptionProps) {
  return (
    <label
      className={
        checked
          ? 'flex cursor-pointer gap-3 rounded-xl border border-zinc-600 bg-zinc-900 p-4'
          : 'flex cursor-pointer gap-3 rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-700'
      }
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />

      <span>
        <span className="block text-sm font-medium text-zinc-200">
          {label}
        </span>

        <span className="mt-1 block text-xs text-zinc-500">
          {description}
        </span>
      </span>
    </label>
  );
}