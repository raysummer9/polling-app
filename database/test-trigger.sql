-- Test script to verify profile creation trigger
-- Run this in Supabase SQL Editor to test the trigger

-- First, let's check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test the trigger manually (if needed)
-- This simulates what happens when a user signs up
-- Replace 'test-user-id' with an actual user ID from auth.users

-- First, check if a test user exists in auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
LIMIT 1;

-- If you want to test the trigger manually, you can run:
-- INSERT INTO auth.users (id, email, raw_user_meta_data) 
-- VALUES ('test-user-id', 'test@example.com', '{"name": "Test User"}');

-- Then check if the profile was created:
-- SELECT * FROM profiles WHERE id = 'test-user-id';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'polls', 'poll_options', 'votes');

-- Check if tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'polls', 'poll_options', 'votes')
AND schemaname = 'public';
