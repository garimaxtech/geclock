import { useState, useEffect } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { supabase } from '../lib/supabase'
import AddEntryModal from '../components/AddEntryModal'
import TimeEntryCard from '../components/TimeEntryCard'
import TimelineView from '../components/TimelineView'

function totalMinutes(entries) {
  return entries.reduce((sum, e) => sum + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)), 0)
}

function formatTotal(mins) {
  if (mins === 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function Today({ categories, userId }) {
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')

  useEffect(() => { fetchEntries() }, [])

  async function fetchEntries() {
    setLoading(true)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const { data } = await supabase
      .from('time_entries').select('*').eq('user_id', userId)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time', { ascending: true })
    setEntries(data || [])
    setLoading(false)
  }

  async function handleSave({ startTime, endTime, categoryId, notes }) {
    await supabase.from('time_entries').insert({
      user_id: userId, start_time: startTime, end_time: endTime,
      category_id: categoryId, notes: notes || null,
    })
    setShowModal(false)
    fetchEntries()
  }

  async function handleDelete(id) {
    await supabase.from('time_entries').delete().eq('id', id)
    fetchEntries()
  }

  const lastEndTime = entries.length > 0 ? entries[entries.length - 1].end_time : null
  const total = totalMinutes(entries)
  const totalLabel = formatTotal(total)
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {totalLabel ? `${totalLabel} logged` : 'nothing yet'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {entries.length === 0
                ? 'start tracking your day'
                : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} today`}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: view === 'list' ? 'white' : 'transparent',
                color: view === 'list' ? '#374151' : '#9ca3af',
                boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ≡ list
            </button>
            <button
              onClick={() => setView('timeline')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: view === 'timeline' ? 'white' : 'transparent',
                color: view === 'timeline' ? '#374151' : '#9ca3af',
                boxShadow: view === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ⏐ time
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-28">
        {loading ? (
          <div className="px-5 flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : view === 'list' ? (
          entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-gray-400 text-sm font-medium">nothing logged yet today</p>
              <p className="text-gray-300 text-xs mt-1">tap + to start</p>
            </div>
          ) : (
            <div className="px-5 flex flex-col gap-2">
              {entries.map(entry => (
                <TimeEntryCard
                  key={entry.id}
                  entry={entry}
                  category={categoryMap[entry.category_id]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        ) : (
          <TimelineView entries={entries} categories={categories} />
        )}
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] pointer-events-none">
        <div className="flex justify-end px-5 pb-24 pointer-events-auto">
          <button
            onClick={() => setShowModal(true)}
            className="w-14 h-14 rounded-full text-white text-2xl font-light shadow-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}
          >
            +
          </button>
        </div>
      </div>

      {showModal && (
        <AddEntryModal
          categories={categories}
          lastEndTime={lastEndTime}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
