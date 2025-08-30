import { createClient } from '@/lib/supabase/server';

export async function getUserPollsServer(userId: string) {
  try {
    const supabase = createClient();
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author:profiles!polls_author_id_fkey (
          id,
          name,
          avatar_url
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
    const supabase = createClient();
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author:profiles!polls_author_id_fkey (
          id,
          name,
          avatar_url
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
