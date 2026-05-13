import { differenceInMinutes } from 'date-fns'

function fmtDuration(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function hourLabel(h) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export default function TimelineView({ entries, categories }) {
  const now = new Date()
  const HOUR_HEIGHT = 60

  // Day range: 6am to at least 10pm or current hour + 1
  const DAY_START = 6
  const DAY_END = Math.max(now.getHours() + 1, 22)
  const totalHeight = (DAY_END - DAY_START) * HOUR_HEIGHT

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

  const nowFrac = now.getHours() + now.getMinutes() / 60
  const nowTop = (nowFrac - DAY_START) * HOUR_HEIGHT
  const showNow = nowFrac >= DAY_START && nowFrac <= DAY_END

  return (
    <div className="px-5 pb-6">
      <div className="flex gap-3">

        {/* Hour labels */}
        <div className="relative flex-shrink-0" style={{ width: 32, height: totalHeight }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute"
              style={{ top: (h - DAY_START) * HOUR_HEIGHT - 7 }}
            >
              <span className="text-[10px] text-gray-300 font-semibold tracking-wide">
                {hourLabel(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div className="flex-1 relative" style={{ height: totalHeight }}>

          {/* Hour tick lines */}
          {hours.map(h => (
            <div
              key={h}
              className="absolute w-full border-t border-gray-100"
              style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
            />
          ))}

          {/* Entry blocks */}
          {entries.map(entry => {
            const start = new Date(entry.start_time)
            const end = new Date(entry.end_time)
            const startFrac = start.getHours() + start.getMinutes() / 60
            const endFrac = end.getHours() + end.getMinutes() / 60
            const top = (startFrac - DAY_START) * HOUR_HEIGHT
            const height = Math.max((endFrac - startFrac) * HOUR_HEIGHT, 30)
            const cat = categoryMap[entry.category_id]
            const mins = differenceInMinutes(end, start)

            return (
              <div
                key={entry.id}
                className="absolute left-0 right-0 rounded-2xl overflow-hidden"
                style={{ top: top + 1, height: height - 2 }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: cat?.color || '#e2e8f0' }}
                />
                {/* Block body */}
                <div
                  className="w-full h-full pl-3 pr-3 flex items-center gap-2"
                  style={{ background: `${cat?.color || '#e2e8f0'}28` }}
                >
                  {height >= 28 && (
                    <span className="text-sm flex-shrink-0">{cat?.emoji || '✨'}</span>
                  )}
                  {height >= 36 && (
                    <span className="text-xs font-semibold text-gray-600 truncate flex-1">
                      {cat?.name || 'Other'}
                    </span>
                  )}
                  {height >= 36 && (
                    <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                      {fmtDuration(mins)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Current time line */}
          {showNow && (
            <div className="absolute w-full flex items-center z-10" style={{ top: nowTop }}>
              <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0 -ml-1" />
              <div className="flex-1 h-px bg-rose-300" />
            </div>
          )}

          {/* Empty state */}
          {entries.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">🌱</span>
              <p className="text-xs text-gray-300 font-medium">nothing logged yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
