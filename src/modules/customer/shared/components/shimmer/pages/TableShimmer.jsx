import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/**
 * Mirrors every DataTable screen in the admin and super-admin modules:
 * toolbar, header row, body rows, pagination. `columns` and `rows` tune it.
 */
export default function TableShimmer({ columns = 5, rows = 8, label = 'Loading table' }) {
  return (
    <ShimmerPage label={label} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ShimmerBar width={180} height={24} />
          <ShimmerBar className="mt-2.5" width={240} height={13} />
        </div>
        <ShimmerBar width={132} height={38} radius={11} />
      </div>

      <ShimmerCard padding={0}>
        <div className="flex items-center gap-3 p-4">
          <ShimmerBar width={220} height={36} radius={11} />
          <ShimmerBar className="ml-auto" width={96} height={36} radius={11} />
        </div>

        <div
          className="grid gap-4 px-4 pb-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {repeat(columns, (i) => <ShimmerBar key={i} width="58%" height={11} />)}
        </div>

        {repeat(rows, (r) => (
          <div
            key={r}
            className="grid gap-4 px-4 py-3.5"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {repeat(columns, (c) => <ShimmerBar key={c} width={c === 0 ? '82%' : '64%'} height={13} />)}
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 p-4">
          <ShimmerBar width={140} height={12} />
          <ShimmerBar width={180} height={32} radius={10} />
        </div>
      </ShimmerCard>
    </ShimmerPage>
  )
}
