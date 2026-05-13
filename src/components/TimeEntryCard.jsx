import { format, differenceInMinutes } from 'date-fns'

function durationLabel(start, end) {
  const mins = differenceInMinutes(new Date(end), new Date(start))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function TimeEntryCard({ entry, category, onDelete }) {
  const start = new Date(entry.start_time)
  const end = new Date(entry.end_time)

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 group border border-gray-50/80">
      {/* Emoji badge */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${category?.color || '#e2e8f0'}30` }}
      >
        {category?.emoji || '✨'}
      </div>

      {/* Category + notes */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-gray-800 text-sm">{category?.name || 'Uncategorised'}</span>
        {entry.notes && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.notes}</p>
        )}
      </div>

      {/* Time range + duration */}
      <div className="text-right flex-shrink-0">
        <div className="text-[11px] text-gray-400 font-medium">
          {format(start, 'h:mm')}–{format(end, 'h:mm a')}
        </div>
        <div
          className="text-[11px] font-bold mt-0.5"
          style={{ color: category?.color ? darken(category.color) : '#9ca3af' }}
        >
          {durationLabel(entry.start_time, entry.end_time)}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-300 hover:text-red-400 hover:bg-red-50 text-[10px] flex-shrink-0 ml-0.5"
      >
        ✕
      </button>
    </div>
  )
}

// Simple darkening: just return a darker shade for text
function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.floor(r * 0.65)}, ${Math.floor(g * 0.65)}, ${Math.floor(b * 0.65)})`
}
