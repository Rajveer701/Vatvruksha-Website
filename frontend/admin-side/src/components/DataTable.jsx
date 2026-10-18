// DataTable — paginated, cursor-based data table for admin screens.
// Columns: [{key, label, render(row)}]
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, data, pageSize = 15 }) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const start = page * pageSize
  const pageData = sorted.slice(start, start + pageSize)

  return (
    <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => {
                    if (sortKey === col.key) {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortKey(col.key)
                      setSortDir('asc')
                    }
                  }}
                  className="cursor-pointer select-none"
                  title={col.key === sortKey ? `Sorted ${sortDir}` : 'Click to sort'}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={row.id || i} className="group">
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-brown-light"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-cream-dark flex items-center justify-between text-sm">
          <div className="text-brown-light">
            Page {page + 1} of {totalPages} &middot; {sorted.length} records
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded hover:bg-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded hover:bg-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
