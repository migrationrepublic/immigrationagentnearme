-- 1. Create the table
CREATE TABLE IF NOT EXISTS tool_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name TEXT NOT NULL, 
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. FIX RECURSION: Update the admins table policy first
-- This prevents the "infinite recursion" error
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
CREATE POLICY "Admins can view admins" ON admins 
FOR SELECT USING (auth.uid() = id);

-- 4. Create Tool Submissions policies
DROP POLICY IF EXISTS "Admins can view and manage tool_submissions" ON tool_submissions;
CREATE POLICY "Admins can view and manage tool_submissions" ON tool_submissions 
FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);

DROP POLICY IF EXISTS "Public can insert tool_submissions" ON tool_submissions;
CREATE POLICY "Public can insert tool_submissions" ON tool_submissions 
FOR INSERT WITH CHECK (true);
