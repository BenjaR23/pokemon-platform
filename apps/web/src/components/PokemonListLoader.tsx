export function PokemonListLoader() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-44 animate-pulse overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950"
        >
          <div className="w-2/5 bg-zinc-900" />

          <div className="flex flex-1 flex-col justify-center gap-4 p-5">
            <div className="h-3 w-12 rounded bg-zinc-800" />
            <div className="h-5 w-28 rounded bg-zinc-800" />

            <div className="flex gap-2">
              <div className="h-6 w-16 rounded bg-zinc-900" />
              <div className="h-6 w-16 rounded bg-zinc-900" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}