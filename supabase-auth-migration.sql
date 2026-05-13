-- Run this in Supabase SQL Editor to upgrade to auth-based security

-- Drop the old open policies
DROP POLICY IF EXISTS "allow all for categories" ON categories;
DROP POLICY IF EXISTS "allow all for time_entries" ON time_entries;

-- New policies: each user can only see and edit their own data
CREATE POLICY "users manage own categories" ON categories
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users manage own entries" ON time_entries
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
