import { createClient } from '@/lib/supabase/client';
import { InsertPoll, InsertPollOption, PollWithOptions, InsertVote } from '@/lib/types/database';

const supabase = createClient();

export async function createPoll(pollData: {
  title: string;
  description: string;
  options: string[];
  allowMultipleVotes: boolean;
  requireLogin: boolean;
  endDate?: string;
}) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user has a profile, create one if not
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check profile: ${profileCheckError.message}`);
    }

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const { error: profileCreateError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (profileCreateError) {
        throw new Error(`Failed to create profile: ${profileCreateError.message}`);
      }
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description,
        author_id: user.id,
        allow_multiple_votes: pollData.allowMultipleVotes,
        require_login: pollData.requireLogin,
        end_date: pollData.endDate || null,
      })
      .select()
      .single();

    if (pollError) {
      throw new Error(`Failed to create poll: ${pollError.message}`);
    }

    // Create poll options
    const pollOptions = pollData.options.map((option, index) => ({
      poll_id: poll.id,
      text: option,
      order_index: index + 1,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);

    if (optionsError) {
      throw new Error(`Failed to create poll options: ${optionsError.message}`);
    }

    return { poll, error: null };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { poll: null, error: error as Error };
  }
}

export async function getPolls() {
  try {
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

export async function getPollById(pollId: string) {
  try {
    const { data: poll, error } = await supabase
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

export async function voteOnPoll(pollId: string, optionIds: string[]) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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

    // Create votes
    const votes = optionIds.map(optionId => ({
      poll_id: pollId,
      option_id: optionId,
      voter_id: user?.id || null,
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

export async function getUserVotes(pollId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
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

export async function deletePoll(pollId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (pollError) {
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    if (poll.author_id !== user.id) {
      throw new Error('You can only delete your own polls');
    }

    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      throw new Error(`Failed to delete poll: ${deleteError.message}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { success: false, error: error as Error };
  }
}

export async function getUserPolls(userId: string) {
  try {
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

export async function updatePoll(pollId: string, updates: {
  title?: string;
  description?: string;
  allow_multiple_votes?: boolean;
  require_login?: boolean;
  end_date?: string | null;
}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (pollError) {
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    if (poll.author_id !== user.id) {
      throw new Error('You can only update your own polls');
    }

    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update(updates)
      .eq('id', pollId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update poll: ${updateError.message}`);
    }

    return { poll: updatedPoll, error: null };
  } catch (error) {
    console.error('Error updating poll:', error);
    return { poll: null, error: error as Error };
  }
}

export async function updatePollOptions(pollId: string, options: { id: string; text: string }[]) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (pollError) {
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    if (poll.author_id !== user.id) {
      throw new Error('You can only update your own polls');
    }

    // Update each option
    for (const option of options) {
      const { error: updateError } = await supabase
        .from('poll_options')
        .update({ text: option.text })
        .eq('id', option.id)
        .eq('poll_id', pollId);

      if (updateError) {
        throw new Error(`Failed to update poll option: ${updateError.message}`);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating poll options:', error);
    return { success: false, error: error as Error };
  }
}
