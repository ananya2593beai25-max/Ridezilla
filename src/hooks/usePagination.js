import { useEffect, useMemo, useState } from "react";

/**
 * Splits a list into pages. `resetKey` is anything that should send the reader back to page 1,
 * for example the search text and the filters.
 */
export function usePagination(items, pageSize = 8, resetKey = "") {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [resetKey]);

  // A list can get shorter (a driver is removed), so never stay on a page that no longer exists.
  const current = Math.min(page, pageCount);
  const slice = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);

  return {
    page: current,
    setPage,
    pageCount,
    slice,
    total: items.length,
    from: items.length ? (current - 1) * pageSize + 1 : 0,
    to: Math.min(current * pageSize, items.length),
  };
}
