import { createServerSupabaseClient } from '@/lib/supabase/factory';
import { 
  PollWithOptions, 
  CreatePollInput, 
  UpdatePollInput, 
  UpdatePollOptionsInput,
  PollsQueryResult,
  PollFilters,
  PollPagination
} from '@/lib/types/poll';
import { 
  createDatabaseError, 
  createNotFoundError, 
  createSuccessResponse, 
  createErrorResponse,
  ApiResponse
} from '@/lib/types/error';
import { validateCreatePollInput, validateUpdatePollInput, validateUpdatePollOptionsInput, sanitizePollInput, sanitizePollUpdateInput } from '@/lib/validation/poll';

/**
 * Creates a new poll with options
 */
export async function createPollOperation(
  input: CreatePollInput,
  authorId: string
): Promise<ApiResponse<PollWithOptions>> {
  try {
    // Validate input
    const validation = validateCreatePollInput(input);
    if (!validation.isValid) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid poll input',
        details: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
        context: { input }
      });
    }

    // Sanitize input
    const sanitizedInput = sanitizePollInput(input);

    const supabase = await createServerSupabaseClient();

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: sanitizedInput.title,
        description: sanitizedInput.description,
        author_id: authorId,
        allow_multiple_votes: sanitizedInput.allowMultipleVotes,
        require_login: sanitizedInput.requireLogin,
        end_date: sanitizedInput.endDate || null,
      })
      .select()
      .single();

    if (pollError) {
      throw createDatabaseError(
        `Failed to create poll: ${pollError.message}`,
        'INSERT',
        'polls'
      );
    }

    // Create poll options
    const pollOptions = sanitizedInput.options.map((text, index) => ({
      poll_id: poll.id,
      text,
      order_index: index,
    }));

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)
      .select();

    if (optionsError) {
      throw createDatabaseError(
        `Failed to create poll options: ${optionsError.message}`,
        'INSERT',
        'poll_options'
      );
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
      throw createDatabaseError(
        `Failed to fetch created poll: ${fetchError.message}`,
        'SELECT',
        'polls'
      );
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error creating poll:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to create poll',
      'CREATE',
      'polls'
    ));
  }
}

/**
 * Gets a poll by ID with options
 */
export async function getPollByIdOperation(pollId: string): Promise<ApiResponse<PollWithOptions>> {
  try {
    const supabase = await createServerSupabaseClient();

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
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${error.message}`,
        'SELECT',
        'polls'
      );
    }

    return createSuccessResponse(poll as PollWithOptions);
  } catch (error) {
    console.error('Error fetching poll:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to fetch poll',
      'SELECT',
      'polls'
    ));
  }
}

/**
 * Gets multiple polls with filtering and pagination
 */
export async function getPollsOperation(
  filters: PollFilters = {},
  pagination: Partial<PollPagination> = {}
): Promise<ApiResponse<PollsQueryResult>> {
  try {
    const supabase = await createServerSupabaseClient();
    
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
      throw createDatabaseError(
        `Failed to fetch polls: ${error.message}`,
        'SELECT',
        'polls'
      );
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
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to fetch polls',
      'SELECT',
      'polls'
    ));
  }
}

/**
 * Updates a poll
 */
export async function updatePollOperation(
  pollId: string,
  input: UpdatePollInput,
  authorId: string
): Promise<ApiResponse<PollWithOptions>> {
  try {
    // Validate input
    const validation = validateUpdatePollInput(input);
    if (!validation.isValid) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid poll update input',
        details: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
        context: { input }
      });
    }

    // Sanitize input
    const sanitizedInput = sanitizePollUpdateInput(input);

    const supabase = await createServerSupabaseClient();

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${fetchError.message}`,
        'SELECT',
        'polls'
      );
    }

    if (existingPoll.author_id !== authorId) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'You can only edit your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, authorId, pollAuthorId: existingPoll.author_id }
      });
    }

    // Update the poll
    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update(sanitizedInput)
      .eq('id', pollId)
      .select()
      .single();

    if (updateError) {
      throw createDatabaseError(
        `Failed to update poll: ${updateError.message}`,
        'UPDATE',
        'polls'
      );
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
      throw createDatabaseError(
        `Failed to fetch updated poll: ${fetchCompleteError.message}`,
        'SELECT',
        'polls'
      );
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error updating poll:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to update poll',
      'UPDATE',
      'polls'
    ));
  }
}

/**
 * Updates poll options
 */
export async function updatePollOptionsOperation(
  pollId: string,
  input: UpdatePollOptionsInput,
  authorId: string
): Promise<ApiResponse<PollWithOptions>> {
  try {
    // Validate input
    const validation = validateUpdatePollOptionsInput(input);
    if (!validation.isValid) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid poll options input',
        details: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
        context: { input }
      });
    }

    const supabase = await createServerSupabaseClient();

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${fetchError.message}`,
        'SELECT',
        'polls'
      );
    }

    if (existingPoll.author_id !== authorId) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'You can only edit your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, authorId, pollAuthorId: existingPoll.author_id }
      });
    }

    // Delete existing options
    const { error: deleteError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteError) {
      throw createDatabaseError(
        `Failed to delete existing poll options: ${deleteError.message}`,
        'DELETE',
        'poll_options'
      );
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
      throw createDatabaseError(
        `Failed to create new poll options: ${insertError.message}`,
        'INSERT',
        'poll_options'
      );
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
      throw createDatabaseError(
        `Failed to fetch updated poll: ${fetchCompleteError.message}`,
        'SELECT',
        'polls'
      );
    }

    return createSuccessResponse(completePoll as PollWithOptions);
  } catch (error) {
    console.error('Error updating poll options:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to update poll options',
      'UPDATE',
      'poll_options'
    ));
  }
}

/**
 * Deletes a poll
 */
export async function deletePollOperation(
  pollId: string,
  authorId: string
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${fetchError.message}`,
        'SELECT',
        'polls'
      );
    }

    if (existingPoll.author_id !== authorId) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'You can only delete your own polls',
        timestamp: new Date().toISOString(),
        context: { pollId, authorId, pollAuthorId: existingPoll.author_id }
      });
    }

    // Delete the poll (cascade will handle options and votes)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      throw createDatabaseError(
        `Failed to delete poll: ${deleteError.message}`,
        'DELETE',
        'polls'
      );
    }

    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error deleting poll:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to delete poll',
      'DELETE',
      'polls'
    ));
  }
}
