import { useState, useEffect } from 'react'
import { subDays, format, startOfDay, endOfDay, eachDayOfInterval, differenceInMinutes } from 'date-fns'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const RANGES = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
]

function minToHours(mins) {
  return Math.round((mins / 60) * 10) / 10
}

function fmtDuration(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function Analytics({ categories, userId }) {
  const [range, setRange] = useState(0)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  useEffect(() => { fetchEntries() }, [range])

  async function fetchEntries() {
    setLoading(true)
    const end = endOfDay(new Date())
    const start = range === 0 ? startOfDay(new Date()) : startOfDay(subDays(new Date(), range))
    const { data } = await supabase
      .from('time_entries').select('*').eq('user_id', userId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
    setEntries(data || [])
    setLoading(false)
  }

  const categoryTotals = {}
  entries.forEach(e => {
    const mins = differenceInMinutes(new Date(e.end_time), new Date(e.start_time))
    categoryTotals[e.category_id] = (categoryTotals[e.category_id] || 0) + mins
  })
  const pieData = Object.entries(categoryTotals)
    .map(([id, mins]) => ({
      name: categoryMap[id]?.name || 'Other',
      value: mins,
      color: categoryMap[id]?.color || '#e2e8f0',
      emoji: categoryMap[id]?.emoji || '✨',
    }))
    .sort((a, b) => b.value - a.value)

  const totalMins = pieData.reduce((s, d) => s + d.value, 0)

  const dailyData = range > 0
    ? eachDayOfInterval({ start: subDays(new Date(), range), end: new Date() }).map(day => {
        const dayEntries = entries.filter(e => {
          const d = new Date(e.start_time)
          return d >= startOfDay(day) && d <= endOfDay(day)
        })
        const mins = dayEntries.reduce((s, e) => s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)), 0)
        return { day: format(day, range === 7 ? 'EEE' : 'MMM d'), hours: minToHours(mins) }
      })
    : []

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-10 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">your time 📊</h1>
        <p className="text-gray-400 text-sm mt-0.5">see where your hours go</p>
      </div>

      <div className="px-5 mb-5">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
              style={{
                background: range === r.days ? 'white' : 'transparent',
                color: range === r.days ? '#7c3aed' : '#9ca3af',
                boxShadow: range === r.days ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-5 flex flex-col gap-3">
          <div className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="text-5xl mb-3">🔭</div>
          <p className="text-gray-500 font-medium">no data yet</p>
          <p className="text-gray-300 text-sm mt-1">log some time to see your analytics!</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-4 pb-8">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">total logged</p>
            <p className="text-4xl font-bold text-gray-900">{fmtDuration(totalMins)}</p>
          </div>

          {pieData.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
              <p className="text-sm font-bold text-gray-700 mb-4">by category</p>
              <div className="flex items-center gap-4">
                <PieChart width={130} height={130}>
                  <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={60}
                    paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
                <div className="flex-1 flex flex-col gap-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-sm text-gray-600 truncate flex-1">{d.emoji} {d.name}</span>
                      <span className="text-xs font-bold text-gray-500">{fmtDuration(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dailyData.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
              <p className="text-sm font-bold text-gray-700 mb-4">hours per day</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={dailyData} barSize={range === 7 ? 28 : 14}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={v => [`${v}h`, 'logged']}
                  />
                  <Bar dataKey="hours" fill="#c084fc" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {pieData.length > 0 && (
            <div className="rounded-3xl p-5 text-white"
              style={{ background: `linear-gradient(135deg, ${pieData[0].color}, ${pieData[0].color}cc)` }}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">most time spent</p>
              <p className="text-2xl font-bold">{pieData[0].emoji} {pieData[0].name}</p>
              <p className="text-sm opacity-80 mt-1">{fmtDuration(pieData[0].value)} · {Math.round((pieData[0].value / totalMins) * 100)}% of total</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
