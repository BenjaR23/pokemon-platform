import { useState } from 'react';
import { useProfile } from './useProfile';

interface DeleteProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteProfileModal({
  open,
  onClose,
}: DeleteProfileModalProps) {
  const {
    profiles,
    activeProfile,
    deleteActiveProfile,
  } = useProfile();

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  if (!open || !activeProfile) {
    return null;
  }

  const isLastProfile =
    profiles.length <= 1;

  async function handleDelete() {
    if (isLastProfile) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteActiveProfile();
      onClose();
    } catch {
      setError(
        'Could not delete the profile.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-zinc-100">
          Delete Profile?
        </h2>

        {isLastProfile ? (
          <>
            <p className="mt-3 text-sm text-zinc-400">
              You cannot delete your last
              profile.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-400">
              Deleting{' '}
              <span className="font-medium text-zinc-200">
                {activeProfile.name}
              </span>{' '}
              will permanently delete its
              collection, favorites and
              profile configuration.
            </p>

            <p className="mt-3 text-sm text-red-400">
              This action cannot be undone.
            </p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={deleting}
                className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/70 disabled:opacity-50"
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete profile'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}