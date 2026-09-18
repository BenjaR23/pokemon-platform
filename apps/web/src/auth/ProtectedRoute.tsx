import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-900" />

          <div className="mt-4 h-4 w-64 animate-pulse rounded bg-zinc-900" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}