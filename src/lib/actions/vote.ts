'use server'

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function voteOnPollServer(pollId: string, optionIds: string[]) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get client IP address
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    // Check if poll exists and get its settings
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) {
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    // Check if poll is active and not ended
    if (poll.status !== 'active') {
      throw new Error('Poll is not active');
    }

    if (poll.end_date && new Date(poll.end_date) < new Date()) {
      throw new Error('Poll has ended');
    }

    // Check if login is required
    if (poll.require_login && !user) {
      throw new Error('Login required to vote on this poll');
    }

    // Check if multiple votes are allowed
    if (!poll.allow_multiple_votes && optionIds.length > 1) {
      throw new Error('Multiple votes not allowed on this poll');
    }

    // Check if user has already voted (for logged-in users)
    if (user) {
      const { data: existingVotes, error: existingVotesError } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('voter_id', user.id);

      if (existingVotesError) {
        throw new Error(`Failed to check existing votes: ${existingVotesError.message}`);
      }

      if (existingVotes.length > 0) {
        throw new Error('You have already voted on this poll');
      }
    }

    // Check if IP has already voted (for anonymous users)
    if (!user && clientIp !== 'unknown') {
      const { data: existingIpVotes, error: existingIpVotesError } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('voter_ip', clientIp);

      if (existingIpVotesError) {
        throw new Error(`Failed to check existing IP votes: ${existingIpVotesError.message}`);
      }

      if (existingIpVotes.length > 0) {
        throw new Error('You have already voted on this poll from this IP address');
      }
    }

    // Get user agent
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Create votes
    const votes = optionIds.map(optionId => ({
      poll_id: pollId,
      option_id: optionId,
      voter_id: user?.id || null,
      voter_ip: user ? null : clientIp,
      voter_user_agent: userAgent,
    }));

    const { error: voteError } = await supabase
      .from('votes')
      .insert(votes);

    if (voteError) {
      throw new Error(`Failed to vote: ${voteError.message}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error voting on poll:', error);
    return { success: false, error: error as Error };
  }
}

export async function getUserVotesServer(pollId: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get client IP address
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    if (userError || !user) {
      // For anonymous users, check if IP has voted
      if (clientIp !== 'unknown') {
        const { data: votes, error } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', pollId)
          .eq('voter_ip', clientIp);

        if (error) {
          throw new Error(`Failed to fetch IP votes: ${error.message}`);
        }

        return { votes: votes.map(v => v.option_id), error: null };
      }
      return { votes: [], error: null };
    }

    const { data: votes, error } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('voter_id', user.id);

    if (error) {
      throw new Error(`Failed to fetch user votes: ${error.message}`);
    }

    return { votes: votes.map(v => v.option_id), error: null };
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return { votes: [], error: error as Error };
  }
}
