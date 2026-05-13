import { useState, useEffect } from 'react'
import { format, differenceInMinutes, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns'
import { supabase } from '../lib/supabase'

function fmtDuration(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

export default function History({ categories, userId }) {
  const [grouped, setGrouped] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  useEffect(() => { fetchHistory() }, [])

  async function fetchHistory() {
    setLoading(true)
    const end = endOfDay(new Date())
    const start = startOfDay(subDays(new Date(), 30))

    const { data } = await supabase
      .from('time_entries').select('*').eq('user_id', userId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: false })

    // Group by date
    const groups = {}
    ;(data || []).forEach(entry => {
      const key = format(new Date(entry.start_time), 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
    })

    const sorted = Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        entries,
        totalMins: entries.reduce((s, e) => s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)), 0),
      }))

    setGrouped(sorted)
    // Expand today and yesterday by default
    const defaultExpanded = {}
    sorted.slice(0, 2).forEach(g => { defaultExpanded[g.date] = true })
    setExpanded(defaultExpanded)
    setLoading(false)
  }

  async function handleDelete(id, date) {
    await supabase.from('time_entries').delete().eq('id', id)
    setGrouped(prev => prev
      .map(g => g.date === date
        ? { ...g, entries: g.entries.filter(e => e.id !== id), totalMins: g.entries.filter(e => e.id !== id).reduce((s, e) => s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)), 0) }
        : g
      )
      .filter(g => g.entries.length > 0)
    )
  }

  function toggle(date) {
    setExpanded(prev => ({ ...prev, [date]: !prev[date] }))
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-10 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">history 📅</h1>
        <p className="text-gray-400 text-sm mt-0.5">last 30 days</p>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-8">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-gray-400 text-sm font-medium">no history yet</p>
            <p className="text-gray-300 text-xs mt-1">start logging to see past days here</p>
          </div>
        ) : grouped.map(({ date, entries, totalMins }) => (
          <div key={date} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
            {/* Day header */}
            <button
              onClick={() => toggle(date)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="text-left">
                <p className="font-bold text-gray-800 text-sm">{dayLabel(date)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {fmtDuration(totalMins)}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini category dots */}
                <div className="flex gap-1">
                  {[...new Set(entries.map(e => e.category_id))].slice(0, 4).map(cid => (
                    <div key={cid} className="w-2 h-2 rounded-full" style={{ background: categoryMap[cid]?.color || '#e2e8f0' }} />
                  ))}
                </div>
                <span className="text-gray-300 text-xs">{expanded[date] ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Entries */}
            {expanded[date] && (
              <div className="border-t border-gray-50 flex flex-col divide-y divide-gray-50">
                {entries.map(entry => {
                  const cat = categoryMap[entry.category_id]
                  const mins = differenceInMinutes(new Date(entry.end_time), new Date(entry.start_time))
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 group">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${cat?.color || '#e2e8f0'}30` }}>
                        {cat?.emoji || '✨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{cat?.name || 'Other'}</p>
                        {entry.notes && <p className="text-xs text-gray-400 truncate">{entry.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(entry.start_time), 'h:mm')}–{format(new Date(entry.end_time), 'h:mm a')}
                        </p>
                        <p className="text-[11px] font-bold" style={{ color: cat?.color ? `rgb(${Math.floor(parseInt(cat.color.slice(1,3),16)*.65)},${Math.floor(parseInt(cat.color.slice(3,5),16)*.65)},${Math.floor(parseInt(cat.color.slice(5,7),16)*.65)})` : '#9ca3af' }}>
                          {fmtDuration(mins)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id, date)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-300 hover:text-red-400 hover:bg-red-50 text-[10px] flex-shrink-0"
                      >✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
