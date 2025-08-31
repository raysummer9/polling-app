-- Test script to verify the vote counting fix works
-- This script tests the vote trigger function to ensure it properly updates vote counts

-- 1. First, let's check the current state of a poll
SELECT 
  p.title,
  p.total_votes,
  po.text as option_text,
  po.votes as option_votes
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
WHERE p.id = '550e8400-e29b-41d4-a716-446655440001'  -- Replace with an actual poll ID
ORDER BY po.order_index;

-- 2. Check the current vote count for this poll
SELECT 
  COUNT(*) as total_votes_in_votes_table
FROM votes 
WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001';  -- Replace with an actual poll ID

-- 3. Check the trigger function definition
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'update_poll_total_votes';

-- 4. Check if the trigger is properly attached
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'update_vote_counts';

-- 5. Test the trigger by manually inserting a vote (if you have a test poll)
-- Uncomment and modify the following lines to test with a real poll:
/*
INSERT INTO votes (poll_id, option_id, voter_ip) 
VALUES (
  'your-poll-id-here', 
  'your-option-id-here', 
  '192.168.1.999'
);

-- Check if the vote counts were updated
SELECT 
  p.title,
  p.total_votes,
  po.text as option_text,
  po.votes as option_votes
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
WHERE p.id = 'your-poll-id-here'
ORDER BY po.order_index;

-- Clean up the test vote
DELETE FROM votes 
WHERE poll_id = 'your-poll-id-here' 
AND voter_ip = '192.168.1.999';
*/
