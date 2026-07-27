import Link from "next/link";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  searchParamName?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  basePath?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "Nessun risultato",
  emptyDescription,
  searchPlaceholder = "Cerca…",
  searchValue = "",
  searchParamName = "q",
  page = 1,
  pageSize = 20,
  total,
  basePath = "",
}: DataTableProps<T>) {
  const totalPages =
    total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  function hrefFor(next: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    if (searchValue) params.set(searchParamName, searchValue);
    params.set("page", String(page));
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-3">
        <form method="get" className="flex gap-2">
          <input
            name={searchParamName}
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
            className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-teal-800"
          >
            Cerca
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-medium">{emptyTitle}</p>
          {emptyDescription && (
            <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn("px-4 py-3 font-medium", col.className)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-border hover:bg-slate-50/80"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 align-middle", col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
          <span>
            Pagina {page} di {totalPages} · {total} risultati
          </span>
          <div className="flex gap-2">
            <Link
              href={hrefFor({ page: Math.max(1, page - 1) })}
              className={cn(
                "rounded-md border border-border px-3 py-1.5 hover:bg-slate-50",
                page <= 1 && "pointer-events-none opacity-40",
              )}
            >
              Precedente
            </Link>
            <Link
              href={hrefFor({ page: Math.min(totalPages, page + 1) })}
              className={cn(
                "rounded-md border border-border px-3 py-1.5 hover:bg-slate-50",
                page >= totalPages && "pointer-events-none opacity-40",
              )}
            >
              Successiva
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
