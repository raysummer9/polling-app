-- Enhanced Row Level Security (RLS) Policies
-- This file contains improved RLS policies to address security vulnerabilities

-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view poll options" ON poll_options;
DROP POLICY IF EXISTS "Poll authors can manage options" ON poll_options;
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Users can vote on polls" ON votes;

-- Enhanced Profiles Policies
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    -- Users can view all profiles (for public information)
    true
  );

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    -- Users can only update their own profile
    auth.uid() = id
  ) WITH CHECK (
    -- Ensure they can only update their own profile
    auth.uid() = id
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (
    -- Users can only insert their own profile
    auth.uid() = id
  );

-- Enhanced Polls Policies
CREATE POLICY "polls_select_public" ON polls
  FOR SELECT USING (
    -- Anyone can view active or ended polls
    status IN ('active', 'ended')
  );

CREATE POLICY "polls_select_own" ON polls
  FOR SELECT USING (
    -- Users can view their own polls regardless of status
    auth.uid() = author_id
  );

CREATE POLICY "polls_insert_policy" ON polls
  FOR INSERT WITH CHECK (
    -- Only authenticated users can create polls
    auth.uid() IS NOT NULL AND
    auth.uid() = author_id
  );

CREATE POLICY "polls_update_policy" ON polls
  FOR UPDATE USING (
    -- Users can only update their own polls
    auth.uid() = author_id
  ) WITH CHECK (
    -- Ensure they can only update their own polls
    auth.uid() = author_id
  );

CREATE POLICY "polls_delete_policy" ON polls
  FOR DELETE USING (
    -- Users can only delete their own polls
    auth.uid() = author_id
  );

-- Enhanced Poll Options Policies
CREATE POLICY "poll_options_select_policy" ON poll_options
  FOR SELECT USING (
    -- Anyone can view poll options for active/ended polls
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.status IN ('active', 'ended')
    ) OR
    -- Or if user owns the poll
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

CREATE POLICY "poll_options_insert_policy" ON poll_options
  FOR INSERT WITH CHECK (
    -- Only poll authors can add options
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

CREATE POLICY "poll_options_update_policy" ON poll_options
  FOR UPDATE USING (
    -- Only poll authors can update options
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  ) WITH CHECK (
    -- Ensure they can only update options for their own polls
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

CREATE POLICY "poll_options_delete_policy" ON poll_options
  FOR DELETE USING (
    -- Only poll authors can delete options
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

-- Enhanced Votes Policies
CREATE POLICY "votes_select_own" ON votes
  FOR SELECT USING (
    -- Users can view their own votes
    (auth.uid() IS NOT NULL AND voter_id = auth.uid()) OR
    -- Or votes from their IP (for anonymous users)
    (auth.uid() IS NULL AND voter_ip = inet_client_addr())
  );

CREATE POLICY "votes_select_poll_author" ON votes
  FOR SELECT USING (
    -- Poll authors can view all votes for their polls
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

CREATE POLICY "votes_insert_policy" ON votes
  FOR INSERT WITH CHECK (
    -- Check if user can vote on this poll
    can_vote_on_poll(poll_id, auth.uid()) AND
    -- Ensure vote belongs to the current user/IP
    (
      (auth.uid() IS NOT NULL AND voter_id = auth.uid() AND voter_ip IS NULL) OR
      (auth.uid() IS NULL AND voter_id IS NULL AND voter_ip = inet_client_addr())
    ) AND
    -- Ensure the option belongs to the poll
    EXISTS (
      SELECT 1 FROM poll_options 
      WHERE poll_options.id = votes.option_id 
      AND poll_options.poll_id = votes.poll_id
    )
  );

CREATE POLICY "votes_delete_own" ON votes
  FOR DELETE USING (
    -- Users can only delete their own votes
    (auth.uid() IS NOT NULL AND voter_id = auth.uid()) OR
    (auth.uid() IS NULL AND voter_ip = inet_client_addr())
  );

-- Enhanced function to check if user can vote on a poll
CREATE OR REPLACE FUNCTION can_vote_on_poll(poll_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
  existing_votes_count INTEGER;
BEGIN
  -- Get poll information
  SELECT * INTO poll_record FROM polls WHERE id = poll_uuid;
  
  -- Check if poll exists
  IF poll_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if poll is active
  IF poll_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if poll has ended
  IF poll_record.end_date IS NOT NULL AND poll_record.end_date < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check if login is required
  IF poll_record.require_login AND user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has already voted
  IF user_uuid IS NOT NULL THEN
    -- Check for existing votes by user ID
    SELECT COUNT(*) INTO existing_votes_count
    FROM votes 
    WHERE poll_id = poll_uuid AND voter_id = user_uuid;
    
    IF existing_votes_count > 0 THEN
      RETURN FALSE;
    END IF;
  ELSE
    -- Check for existing votes by IP
    SELECT COUNT(*) INTO existing_votes_count
    FROM votes 
    WHERE poll_id = poll_uuid AND voter_ip = inet_client_addr();
    
    IF existing_votes_count > 0 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_polls_author_id_status ON polls(author_id, status);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_voter ON votes(poll_id, voter_id) WHERE voter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_poll_ip ON votes(poll_id, voter_ip) WHERE voter_ip IS NOT NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON POLICY "polls_select_public" ON polls IS 'Allows public access to active and ended polls';
COMMENT ON POLICY "polls_select_own" ON polls IS 'Allows users to view their own polls regardless of status';
COMMENT ON POLICY "votes_insert_policy" ON votes IS 'Enforces voting rules and prevents duplicate votes';
COMMENT ON FUNCTION can_vote_on_poll(UUID, UUID) IS 'Validates if a user can vote on a specific poll';
