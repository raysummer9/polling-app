-- Comprehensive fix for anonymous voting issue
-- This script addresses the RLS policy issue that prevents vote counts from updating

-- 1. Drop the existing trigger first
DROP TRIGGER IF EXISTS update_vote_counts ON votes;

-- 2. Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_poll_total_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE polls SET total_votes = total_votes + 1 WHERE id = NEW.poll_id;
    UPDATE poll_options SET votes = votes + 1 WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE polls SET total_votes = total_votes - 1 WHERE id = OLD.poll_id;
    UPDATE poll_options SET votes = votes - 1 WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER update_vote_counts AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_total_votes();

-- 4. Add RLS policy to allow the trigger function to update polls and poll_options
-- This policy allows updates to vote counts by the trigger function
CREATE POLICY "Allow vote count updates by trigger" ON polls
  FOR UPDATE USING (true);

CREATE POLICY "Allow vote count updates by trigger" ON poll_options
  FOR UPDATE USING (true);

-- 5. Verify the fix by checking the function definition
SELECT 
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'update_poll_total_votes';

-- 6. Test the trigger by checking if it's properly attached
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_vote_counts';

-- 7. Optional: Recalculate vote counts for existing polls to fix any inconsistencies
-- This will ensure all existing polls have correct vote counts
UPDATE polls SET total_votes = (
  SELECT COUNT(*) 
  FROM votes 
  WHERE votes.poll_id = polls.id
);

UPDATE poll_options SET votes = (
  SELECT COUNT(*) 
  FROM votes 
  WHERE votes.option_id = poll_options.id
);
