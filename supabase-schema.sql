-- Run this in your Supabase project's SQL editor

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT '#e2e8f0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_start_time ON time_entries(start_time);

-- Enable Row Level Security (but allow all via anon key for personal use)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anyone with the anon key
CREATE POLICY "allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all for time_entries" ON time_entries FOR ALL USING (true) WITH CHECK (true);
