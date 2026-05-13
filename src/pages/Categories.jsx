import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PALETTE = [
  '#c4b5fd', '#fca5a5', '#6ee7b7', '#93c5fd',
  '#fcd34d', '#fdba74', '#f9a8d4', '#a5f3fc',
  '#d9f99d', '#e9d5ff', '#fef08a', '#bfdbfe',
]

const EMOJI_OPTS = ['🌙', '📚', '💪', '💼', '🍳', '🎮', '😴', '👫', '🎨', '🎵', '✈️', '🛒', '🏡', '🌿', '🧘', '💻', '📺', '🤝', '✨', '🌸']

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-12 h-12 text-2xl rounded-2xl bg-gray-50 border-2 border-gray-100 hover:border-purple-200 transition-colors flex items-center justify-center">
        {value}
      </button>
      {open && (
        <div className="absolute top-14 left-0 z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 grid grid-cols-5 gap-1 w-52">
          {EMOJI_OPTS.map(e => (
            <button key={e} type="button" onClick={() => { onChange(e); setOpen(false) }}
              className="w-9 h-9 text-xl rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [emoji, setEmoji] = useState(initial?.emoji || '✨')
  const [color, setColor] = useState(initial?.color || PALETTE[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), emoji, color })
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-purple-100">
      <div className="flex items-center gap-3 mb-4">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="category name" maxLength={24}
          className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-purple-300 bg-gray-50 transition-colors" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {PALETTE.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)}
            className="w-8 h-8 rounded-full transition-all"
            style={{ background: c, transform: color === c ? 'scale(1.2)' : 'scale(1)', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors">cancel</button>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}>
          {saving ? 'saving…' : 'save'}
        </button>
      </div>
    </div>
  )
}

export default function Categories({ categories, userId, onRefresh, onSignOut }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function handleAdd(data) {
    await supabase.from('categories').insert({ ...data, user_id: userId })
    setAdding(false)
    onRefresh()
  }

  async function handleEdit(id, data) {
    await supabase.from('categories').update(data).eq('id', id)
    setEditingId(null)
    onRefresh()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-10 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">categories 🏷️</h1>
          <p className="text-gray-400 text-sm mt-0.5">customise your tracking labels</p>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs text-gray-300 font-medium hover:text-gray-400 transition-colors mt-1"
        >
          sign out
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-8">
        {categories.map(cat => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <CategoryForm initial={cat} onSave={d => handleEdit(cat.id, d)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat.color}33` }}>
                  {cat.emoji}
                </div>
                <span className="flex-1 font-semibold text-gray-800">{cat.name}</span>
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <button onClick={() => setEditingId(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors text-sm ml-1">✏️</button>
                <button onClick={() => handleDelete(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors text-sm">🗑️</button>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <CategoryForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-purple-200 text-purple-400 font-semibold text-sm hover:border-purple-300 hover:text-purple-500 transition-colors">
            + add category
          </button>
        )}
      </div>
    </div>
  )
}
