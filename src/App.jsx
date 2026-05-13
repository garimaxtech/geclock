import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthScreen from './components/AuthScreen'
import Today from './pages/Today'
import Analytics from './pages/Analytics'
import Categories from './pages/Categories'

const TABS = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'analytics', label: 'Stats', icon: '📊' },
  { id: 'categories', label: 'Labels', icon: '🏷️' },
]

const DEFAULT_CATEGORIES = [
  { name: 'Chilling', emoji: '🌙', color: '#c4b5fd' },
  { name: 'Reading', emoji: '📚', color: '#fcd34d' },
  { name: 'Exercise', emoji: '💪', color: '#6ee7b7' },
  { name: 'Work', emoji: '💼', color: '#93c5fd' },
  { name: 'Cooking', emoji: '🍳', color: '#fdba74' },
  { name: 'Social', emoji: '👫', color: '#f9a8d4' },
  { name: 'Gaming', emoji: '🎮', color: '#818cf8' },
  { name: 'Other', emoji: '✨', color: '#e2e8f0' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('today')
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load categories once logged in
  useEffect(() => {
    if (session?.user) bootstrapCategories(session.user.id)
  }, [session?.user?.id])

  async function bootstrapCategories(userId) {
    setCategoriesLoading(true)
    const { data } = await supabase
      .from('categories').select('*').eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      setCategories(data)
    } else {
      const { data: inserted } = await supabase
        .from('categories')
        .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId })))
        .select()
      setCategories(inserted || [])
    }
    setCategoriesLoading(false)
  }

  async function refreshCategories() {
    if (!session?.user) return
    const { data } = await supabase
      .from('categories').select('*').eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    setCategories(data || [])
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-3 bg-[#FDF8F6]">
        <div className="text-4xl animate-bounce">⏱️</div>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  if (categoriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-3 bg-[#FDF8F6]">
        <div className="text-4xl animate-bounce">⏱️</div>
        <p className="text-gray-400 text-sm font-medium">loading…</p>
      </div>
    )
  }

  const userId = session.user.id

  return (
    <div className="flex flex-col min-h-dvh bg-[#FDF8F6]">
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === 'today' && <Today categories={categories} userId={userId} />}
        {tab === 'analytics' && <Analytics categories={categories} userId={userId} />}
        {tab === 'categories' && (
          <Categories
            categories={categories}
            userId={userId}
            onRefresh={refreshCategories}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] pb-safe">
        <div className="mx-4 mb-3 bg-white/90 backdrop-blur rounded-2xl border border-gray-100/80 shadow-lg flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
            >
              <span className="text-lg leading-none" style={{ filter: tab === t.id ? 'none' : 'grayscale(1) opacity(0.35)' }}>
                {t.icon}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: tab === t.id ? '#7c3aed' : '#c4b5fd' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
