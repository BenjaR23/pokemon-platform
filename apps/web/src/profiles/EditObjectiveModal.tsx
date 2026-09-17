import {
  useState,
  type FormEvent,
} from 'react';
import type {
  CollectionObjectiveMode,
  CollectionProfileDetail,
} from './profiles.api';
import { useProfile } from './useProfile';

interface EditObjectiveModalProps {
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

export function EditObjectiveModal({
  open,
  onClose,
}: EditObjectiveModalProps) {
  const {
    activeProfile,
    updateActiveProfile,
  } = useProfile();

  if (!open || !activeProfile) {
    return null;
  }

  return (
    <EditObjectiveForm
      key={activeProfile.id}
      profile={activeProfile}
      onClose={onClose}
      updateActiveProfile={
        updateActiveProfile
      }
    />
  );
}

interface EditObjectiveFormProps {
  profile: CollectionProfileDetail;
  onClose: () => void;
  updateActiveProfile: (
    input: {
      name?: string;
      objectiveMode?: CollectionObjectiveMode;
      generationIds?: number[];
      startPokemonNumber?: number;
      endPokemonNumber?: number;
    },
  ) => Promise<void>;
}

function EditObjectiveForm({
  profile,
  onClose,
  updateActiveProfile,
}: EditObjectiveFormProps) {
  const [
    objectiveMode,
    setObjectiveMode,
  ] =
    useState<CollectionObjectiveMode>(
      profile.objectiveMode,
    );

  const [
    selectedGenerations,
    setSelectedGenerations,
  ] = useState<number[]>(
    profile.generations.map(
      (entry) =>
        entry.generation.externalId,
    ),
  );

  const [
    startPokemonNumber,
    setStartPokemonNumber,
  ] = useState(
    profile.startPokemonNumber
      ?.toString() ?? '',
  );

  const [
    endPokemonNumber,
    setEndPokemonNumber,
  ] = useState(
    profile.endPokemonNumber
      ?.toString() ?? '',
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

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

    setSaving(true);

    try {
      if (objectiveMode === 'ALL') {
        await updateActiveProfile({
          objectiveMode: 'ALL',
        });
      }

      if (
        objectiveMode ===
        'GENERATIONS'
      ) {
        await updateActiveProfile({
          objectiveMode:
            'GENERATIONS',
          generationIds:
            selectedGenerations,
        });
      }

      if (objectiveMode === 'RANGE') {
        await updateActiveProfile({
          objectiveMode: 'RANGE',
          startPokemonNumber: start,
          endPokemonNumber: end,
        });
      }

      onClose();
    } catch {
      setError(
        'Could not update the objective.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              Edit Objective
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Changing the objective does
              not remove Pokémon from your
              collection.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) =>
            void handleSubmit(event)
          }
          className="space-y-6 p-6"
        >
          <ObjectiveOption
            checked={
              objectiveMode === 'ALL'
            }
            label="All Pokémon"
            description="Use every Pokémon species as the completion objective."
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
              setObjectiveMode('RANGE')
            }
          />

          {objectiveMode ===
            'GENERATIONS' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENERATIONS.map(
                (generation) => {
                  const checked =
                    selectedGenerations.includes(
                      generation.id,
                    );

                  return (
                    <label
                      key={generation.id}
                      className={
                        checked
                          ? 'flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2.5 text-sm text-emerald-200'
                          : 'flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
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

          {objectiveMode === 'RANGE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="objective-range-start"
                  className="text-xs text-zinc-500"
                >
                  From
                </label>

                <input
                  id="objective-range-start"
                  type="number"
                  min="1"
                  value={startPokemonNumber}
                  onChange={(event) =>
                    setStartPokemonNumber(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="objective-range-end"
                  className="text-xs text-zinc-500"
                >
                  To
                </label>

                <input
                  id="objective-range-end"
                  type="number"
                  min="1"
                  value={endPokemonNumber}
                  onChange={(event) =>
                    setEndPokemonNumber(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save objective'}
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