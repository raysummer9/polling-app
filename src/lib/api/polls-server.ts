import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function getUserPollsServer(userId: string) {
  try {
    const supabase = await createClient();
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author:profiles!polls_author_id_fkey (
          id,
          name,
          avatar_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user polls: ${error.message}`);
    }

    return { polls, error: null };
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return { polls: null, error: error as Error };
  }
}

export async function getPollsServer() {
  try {
    const supabase = await createClient();
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author:profiles!polls_author_id_fkey (
          id,
          name,
          avatar_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch polls: ${error.message}`);
    }

    return { polls, error: null };
  } catch (error) {
    console.error('Error fetching polls:', error);
    return { polls: null, error: error as Error };
  }
}

export async function getUserVotesWithIpServer(pollId: string) {
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

export async function getPollByIdServer(pollId: string) {
  try {
    const supabase = await createClient();
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author:profiles!polls_author_id_fkey (
          id,
          name,
          avatar_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .eq('id', pollId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch poll: ${error.message}`);
    }

    return { poll, error: null };
  } catch (error) {
    console.error('Error fetching poll:', error);
    return { poll: null, error: error as Error };
  }
}
