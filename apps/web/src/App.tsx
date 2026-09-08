import { useEffect, useState } from "react";
import { PokemonList } from "./components/PokemonList";
import type { PokemonListItem, PokemonListResponse } from "./types/pokemon";

function App() {
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPokemon() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3000/pokemon?page=${page}&pageSize=24`);

        if (!response.ok) {
          throw new Error('Failed to load Pokemon');
        }

        const data: PokemonListResponse = await response.json();

        setPokemon(data.items);
        setTotalPages(data.pagination.totalPages);
      } catch {
        setError('Could not load the Pokedex.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadPokemon();
  }, [page]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Pokemon Database
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Pokedex
          </h1>
        </header>

        {isLoading && (
          <p className="text-zinc-400">
            Loading Pokemon...
          </p>
        )}

        {error && (
          <p className="text-zinc-400">
            {error}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <PokemonList pokemon={pokemon} />

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  disabled={page == 1}
                  className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-zinc-400">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={page == totalPages}
                  className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default App;