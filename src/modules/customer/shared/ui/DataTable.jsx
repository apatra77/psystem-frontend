import { colors } from '@/app/themes/colors'
import EmptyState from './EmptyState'

/**
 * Minimal declarative table.
 * columns: [{ key, header, width, align, render(row) }]
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, empty, onRowClick }) {
  if (!rows?.length) return empty ?? <EmptyState />
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-extrabold uppercase tracking-wider text-[10.5px] px-4 py-3"
                style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}`, width: col.width, textAlign: col.align ?? 'left' }}
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
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer transition-colors hover:bg-white/[0.03]' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3.5 align-middle"
                  style={{ color: colors.text, borderBottom: `1px solid ${colors.borderSubtle}`, textAlign: col.align ?? 'left' }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
