-- 1. Fix RLS recursion on the admins table
-- This allows admins to check if they are in the admins table without infinite loops
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
CREATE POLICY "Admins can view admins" ON admins 
FOR SELECT USING (auth.uid() = id);

-- 2. Ensure Bookings policy is robust
DROP POLICY IF EXISTS "Admins can view and manage bookings" ON bookings;
CREATE POLICY "Admins can view and manage bookings" ON bookings 
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- 3. Ensure Tool Submissions policies are robust
DROP POLICY IF EXISTS "Admins can view and manage tool_submissions" ON tool_submissions;
CREATE POLICY "Admins can view and manage tool_submissions" ON tool_submissions 
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- 4. Ensure Public can insert tool leads (fallback for direct client-side calls)
DROP POLICY IF EXISTS "Public can insert tool_submissions" ON tool_submissions;
CREATE POLICY "Public can insert tool_submissions" ON tool_submissions 
FOR INSERT TO public WITH CHECK (true);

-- 5. IMPORTANT: Add YOUR email as an admin
-- Replace 'your-email@example.com' with the email you use to sign in
-- You can run this part manually with your actual ID if you know it, 
-- or just ensure your email is in the admins table.
-- INSERT INTO admins (id, email, role) 
-- SELECT id, email, 'admin' FROM auth.users WHERE email = 'your-email@example.com'
-- ON CONFLICT (id) DO NOTHING;
