// Page controls under a long list: "Showing 1 to 8 of 23", Prev, numbered pages, Next.
// On a phone the numbers give way to "Page 2 of 5".

/** [1, "…", 4, 5, 6, "…", 12]: always the first, the last and the neighbours of the current page. */
function pageList(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, pageCount, total, from, to, onPage, noun = "items" }) {
  if (total === 0) return null;

  return (
    <nav className="pager" aria-label="Pagination">
      <p className="pager__info" role="status">
        Showing {from} to {to} of {total} {noun}
      </p>

      {pageCount > 1 && (
        <div className="pager__pages">
          <button type="button" className="pager__btn" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
            Prev
          </button>

          {pageList(page, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="pager__gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="pager__btn pager__num"
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}

          <span className="pager__status">
            Page {page} of {pageCount}
          </span>

          <button type="button" className="pager__btn" onClick={() => onPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
            Next
          </button>
        </div>
      )}
    </nav>
  );
}
