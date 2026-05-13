import { useState, useEffect } from 'react'
import { format } from 'date-fns'

const DEFAULT_COLORS = [
  '#c4b5fd', '#fca5a5', '#6ee7b7', '#93c5fd',
  '#fcd34d', '#fdba74', '#f9a8d4', '#a5f3fc',
]

export default function AddEntryModal({ categories, lastEndTime, onSave, onClose }) {
  const now = new Date()
  const defaultStart = lastEndTime
    ? format(new Date(lastEndTime), 'HH:mm')
    : format(now, 'HH:mm')

  const [startTime, setStartTime] = useState(defaultStart)
  const [endTime, setEndTime] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
    }
  }, [categories])

  async function handleSave() {
    if (!endTime) return setError('Pick an end time!')
    const today = format(new Date(), 'yyyy-MM-dd')
    const start = new Date(`${today}T${startTime}:00`)
    const end = new Date(`${today}T${endTime}:00`)
    if (end <= start) return setError('End time must be after start time.')
    setError('')
    setSaving(true)
    await onSave({ startTime: start.toISOString(), endTime: end.toISOString(), categoryId, notes })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 animate-slide-up">

        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Log time ✏️</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            ✕
          </button>
        </div>

        {/* Time range */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">From</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-lg font-semibold text-gray-800 focus:outline-none focus:border-purple-300 bg-gray-50 transition-colors"
            />
          </div>
          <div className="flex items-end pb-1 text-gray-300 font-light text-2xl">→</div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">To</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-lg font-semibold text-gray-800 focus:outline-none focus:border-purple-300 bg-gray-50 transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: categoryId === cat.id ? cat.color : `${cat.color}33`,
                  color: categoryId === cat.id ? '#1a1a2e' : '#555',
                  border: `2px solid ${categoryId === cat.id ? cat.color : 'transparent'}`,
                  transform: categoryId === cat.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="anything to add?"
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-purple-300 bg-gray-50 transition-colors placeholder:text-gray-300"
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}
        >
          {saving ? 'Saving…' : 'Save entry ✨'}
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  )
}
