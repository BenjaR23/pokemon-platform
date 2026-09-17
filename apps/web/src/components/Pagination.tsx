interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const paginationItems =
    getPaginationItems(
      page,
      totalPages,
    );

  return (
    <nav
      aria-label="Pokedex pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        aria-label="First page"
        className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        «
      </button>

      <button
        type="button"
        onClick={() =>
          onPageChange(
            Math.max(1, page - 1),
          )
        }
        disabled={page === 1}
        aria-label="Previous page"
        className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {paginationItems.map((item) => {
        if (
          typeof item !== 'number'
        ) {
          return (
            <span
              key={item}
              className="px-2 text-sm text-zinc-600"
            >
              ...
            </span>
          );
        }

        const isCurrentPage =
          item === page;

        return (
          <button
            key={item}
            type="button"
            onClick={() =>
              onPageChange(item)
            }
            aria-current={
              isCurrentPage
                ? 'page'
                : undefined
            }
            className={
              isCurrentPage
                ? 'cursor-default rounded-lg border border-zinc-500 bg-zinc-700 px-3 py-2 text-sm font-medium text-white'
                : 'cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800'
            }
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() =>
          onPageChange(
            Math.min(
              totalPages,
              page + 1,
            ),
          )
        }
        disabled={
          page === totalPages
        }
        aria-label="Next page"
        className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>

      <button
        type="button"
        onClick={() =>
          onPageChange(totalPages)
        }
        disabled={
          page === totalPages
        }
        aria-label="Last page"
        className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        »
      </button>
    </nav>
  );
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<
  | number
  | 'ellipsis-start'
  | 'ellipsis-end'
> {
  if (totalPages <= 9) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  const items: Array<
    | number
    | 'ellipsis-start'
    | 'ellipsis-end'
  > = [];

  const firstPages = [1, 2];
  const lastPages = [
    totalPages - 1,
    totalPages,
  ];

  items.push(...firstPages);

  const middleStart = Math.max(
    3,
    currentPage - 2,
  );

  const middleEnd = Math.min(
    totalPages - 2,
    currentPage + 2,
  );

  if (middleStart > 3) {
    items.push('ellipsis-start');
  }

  for (
    let pageNumber = middleStart;
    pageNumber <= middleEnd;
    pageNumber++
  ) {
    if (
      !items.includes(pageNumber)
    ) {
      items.push(pageNumber);
    }
  }

  if (
    middleEnd <
    totalPages - 2
  ) {
    items.push('ellipsis-end');
  }

  for (const pageNumber of lastPages) {
    if (
      !items.includes(pageNumber)
    ) {
      items.push(pageNumber);
    }
  }

  return items;
}