import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Navbar() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      setShowLogoutConfirm(false);
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="border-b border-zinc-900 bg-black">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-zinc-100"
          >
            Pokédex
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-zinc-300 transition hover:text-white"
            >
              Pokédex
            </Link>

            { user ? (
              <Link
                to="/collection"
                className='text-zinc-300 transition hover:text-white'
              >
                Collection
              </Link>
            ) : (
              <span className='cursor-default text-zinc-600'>
                Collection
              </span>
            )}

            {user ? (
              <Link
                to="/favorites"
                className="text-zinc-300 transition hover:text-white"
              >
                Favorites
              </Link>
            ) : (
              <span className="cursor-default text-zinc-600">
                Favorites
              </span>
            )}
          </div>

          {!loading && (
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-zinc-300">
                    Hello,{' '}
                    <span className="font-medium text-zinc-100">
                      {user.username}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setShowLogoutConfirm(true)
                    }
                    disabled={loggingOut}
                    className="rounded-lg border border-red-900 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:border-red-700 hover:bg-red-950/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-zinc-300 transition hover:text-white"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-zinc-100">
              Log out?
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to end your session?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
                disabled={loggingOut}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut
                  ? 'Logging out...'
                  : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}