import { Link } from 'react-router-dom';

export function Navbar() {
  return (
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

          <span className="cursor-default text-zinc-600">
            Collection
          </span>

          <span className="cursor-default text-zinc-600">
            Favorites
          </span>
        </div>
      </nav>
    </header>
  );
}