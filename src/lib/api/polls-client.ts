import { createBrowserSupabaseClient } from '@/lib/supabase/factory';
import { 
  CreatePollInput, 
  UpdatePollInput, 
  UpdatePollOptionsInput,
  VoteInput,
  PollWithOptions,
  PollsQueryResult,
  PollFilters,
  PollPagination
} from '@/lib/types/poll';
import { 
  createSuccessResponse, 
  createErrorResponse,
  ApiResponse
} from '@/lib/types/error';

/**
 * Creates a new poll (client-side)
 */
export async function createPollClient(input: CreatePollInput): Promise<ApiResponse<PollWithOptions>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return createErrorResponse({
        code: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated',
        details: 'Authentication required to create polls',
        timestamp: new Date().toISOString(),
        context: { input }
      });
    }

    // Check if user has a profile, create one if not
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to check user profile',
        details: profileCheckError.message,
        timestamp: new Date().toISOString(),
        context: { userId: user.id }
      });
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
        return createErrorResponse({
          code: 'DATABASE_ERROR',
          message: 'Failed to create user profile',
          details: profileCreateError.message,
          timestamp: new Date().toISOString(),
          context: { userId: user.id }
        });
      }
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || '',
        author_id: user.id,
        allow_multiple_votes: input.allowMultipleVotes,
        require_login: input.requireLogin,
        end_date: input.endDate || null,
      })
      .select()
      .single();

    if (pollError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to create poll',
        details: pollError.message,
        timestamp: new Date().toISOString(),
        context: { input, userId: user.id }
      });
    }

    // Create poll options
    const pollOptions = input.options
      .filter(opt => opt.trim().length > 0)
      .map((text, index) => ({
        poll_id: poll.id,
        text: text.trim(),
        order_index: index,
      }));

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)
      .select();

    if (optionsError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to create poll options',
        details: optionsError.message,
        timestamp: new Date().toISOString(),
        context: { pollId: poll.id, options: pollOptions }
      });
    }

    // Get the complete poll with options
    const { data: completePoll, error: fetchError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', poll.id)
      .single();

    if (fetchError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch created poll',
        details: fetchError.message,
        timestamp: new Date().toISOString(),
        context: { pollId: poll.id }
      });
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error creating poll:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to create poll',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { input }
    });
  }
}

/**
 * Gets a poll by ID (client-side)
 */
export async function getPollByIdClient(pollId: string): Promise<ApiResponse<PollWithOptions>> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author_profile:profiles!polls_author_id_fkey (*)
      `)
      .eq('id', pollId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Poll not found',
          details: `Poll with ID ${pollId} does not exist`,
          timestamp: new Date().toISOString(),
          context: { pollId }
        });
      }
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch poll',
        details: error.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    return createSuccessResponse(poll as PollWithOptions);
  } catch (error) {
    console.error('Error fetching poll:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to fetch poll',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { pollId }
    });
  }
}

/**
 * Gets multiple polls with filtering and pagination (client-side)
 */
export async function getPollsClient(
  filters: PollFilters = {},
  pagination: Partial<PollPagination> = {}
): Promise<ApiResponse<PollsQueryResult>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        author_profile:profiles!polls_author_id_fkey (*)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    if (filters.requireLogin !== undefined) {
      query = query.eq('require_login', filters.requireLogin);
    }
    if (filters.allowMultipleVotes !== undefined) {
      query = query.eq('allow_multiple_votes', filters.allowMultipleVotes);
    }
    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter.toISOString());
    }
    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore.toISOString());
    }

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: polls, error, count } = await query;

    if (error) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch polls',
        details: error.message,
        timestamp: new Date().toISOString(),
        context: { filters, pagination }
      });
    }

    const result: PollsQueryResult = {
      polls: polls as PollWithOptions[],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
      error: null,
    };

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to fetch polls',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { filters, pagination }
    });
  }
}

/**
 * Updates a poll (client-side)
 */
export async function updatePollClient(
  pollId: string,
  input: UpdatePollInput
): Promise<ApiResponse<PollWithOptions>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return createErrorResponse({
        code: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated',
        details: 'Authentication required to update polls',
        timestamp: new Date().toISOString(),
        context: { pollId, input }
      });
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Poll not found',
          details: `Poll with ID ${pollId} does not exist`,
          timestamp: new Date().toISOString(),
          context: { pollId }
        });
      }
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch poll',
        details: fetchError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    if (existingPoll.author_id !== user.id) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'Access denied',
        details: 'You can only edit your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, userId: user.id, pollAuthorId: existingPoll.author_id }
      });
    }

    // Update the poll
    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update(input)
      .eq('id', pollId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to update poll',
        details: updateError.message,
        timestamp: new Date().toISOString(),
        context: { pollId, input }
      });
    }

    // Get the complete updated poll with options
    const { data: completePoll, error: fetchCompleteError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .single();

    if (fetchCompleteError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch updated poll',
        details: fetchCompleteError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error updating poll:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to update poll',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { pollId, input }
    });
  }
}

/**
 * Updates poll options (client-side)
 */
export async function updatePollOptionsClient(
  pollId: string,
  input: UpdatePollOptionsInput
): Promise<ApiResponse<PollWithOptions>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return createErrorResponse({
        code: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated',
        details: 'Authentication required to update poll options',
        timestamp: new Date().toISOString(),
        context: { pollId, input }
      });
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Poll not found',
          details: `Poll with ID ${pollId} does not exist`,
          timestamp: new Date().toISOString(),
          context: { pollId }
        });
      }
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch poll',
        details: fetchError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    if (existingPoll.author_id !== user.id) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'Access denied',
        details: 'You can only edit your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, userId: user.id, pollAuthorId: existingPoll.author_id }
      });
    }

    // Delete existing options
    const { error: deleteError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to delete existing poll options',
        details: deleteError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    // Create new options
    const newOptions = input.options.map((option, index) => ({
      poll_id: pollId,
      text: option.text.trim(),
      order_index: index,
    }));

    const { error: insertError } = await supabase
      .from('poll_options')
      .insert(newOptions);

    if (insertError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to create new poll options',
        details: insertError.message,
        timestamp: new Date().toISOString(),
        context: { pollId, newOptions }
      });
    }

    // Get the complete updated poll with options
    const { data: completePoll, error: fetchCompleteError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .single();

    if (fetchCompleteError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch updated poll',
        details: fetchCompleteError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error updating poll options:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to update poll options',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { pollId, input }
    });
  }
}

/**
 * Deletes a poll (client-side)
 */
export async function deletePollClient(pollId: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return createErrorResponse({
        code: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated',
        details: 'Authentication required to delete polls',
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Poll not found',
          details: `Poll with ID ${pollId} does not exist`,
          timestamp: new Date().toISOString(),
          context: { pollId }
        });
      }
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch poll',
        details: fetchError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    if (existingPoll.author_id !== user.id) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'Access denied',
        details: 'You can only delete your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, userId: user.id, pollAuthorId: existingPoll.author_id }
      });
    }

    // Delete the poll (cascade will handle options and votes)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to delete poll',
        details: deleteError.message,
        timestamp: new Date().toISOString(),
        context: { pollId }
      });
    }

    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error deleting poll:', error);
    return createErrorResponse({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to delete poll',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      context: { pollId }
    });
  }
}
