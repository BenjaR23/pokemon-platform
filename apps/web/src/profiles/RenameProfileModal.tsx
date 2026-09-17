import {
  useState,
  type FormEvent,
} from 'react';
import { useProfile } from './useProfile';

interface RenameProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function RenameProfileModal({
  open,
  onClose,
}: RenameProfileModalProps) {
  const {
    activeProfile,
    updateActiveProfile,
  } = useProfile();

  if (!open || !activeProfile) {
    return null;
  }

  return (
    <RenameProfileForm
      key={activeProfile.id}
      initialName={activeProfile.name}
      onClose={onClose}
      updateActiveProfile={
        updateActiveProfile
      }
    />
  );
}

interface RenameProfileFormProps {
  initialName: string;
  onClose: () => void;
  updateActiveProfile: (
    input: {
      name?: string;
    },
  ) => Promise<void>;
}

function RenameProfileForm({
  initialName,
  onClose,
  updateActiveProfile,
}: RenameProfileFormProps) {
  const [name, setName] =
    useState(initialName);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

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

    if (trimmedName === initialName) {
      onClose();
      return;
    }

    setSaving(true);

    try {
      await updateActiveProfile({
        name: trimmedName,
      });

      onClose();
    } catch {
      setError(
        'Could not rename the profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <h2 className="text-xl font-semibold text-zinc-100">
            Rename Profile
          </h2>

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
          className="p-6"
        >
          <label
            htmlFor="rename-profile"
            className="text-sm font-medium text-zinc-300"
          >
            Name
          </label>

          <input
            id="rename-profile"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            maxLength={50}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
          />

          {error && (
            <p className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}