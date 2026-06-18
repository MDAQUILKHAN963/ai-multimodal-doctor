import { useState } from 'react';

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  return {
    page,
    goTo:  (p) => setPage(p),
    prev:  () => setPage((p) => Math.max(1, p - 1)),
    next:  (totalPages) => setPage((p) => Math.min(totalPages, p + 1)),
    reset: () => setPage(1),
  };
}
