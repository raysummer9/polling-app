import { createServerSupabaseClient } from '@/lib/supabase/factory';
import { VoteInput, VoteResponse, UserVotesResponse } from '@/lib/types/poll';
import { AppUser } from '@/lib/types/auth';
import { 
  createDatabaseError, 
  createNotFoundError, 
  createSuccessResponse, 
  createErrorResponse,
  ApiResponse
} from '@/lib/types/error';
import { validateVoteInput, validateVoteEligibility } from '@/lib/validation/poll';
import { getClientIp, getUserAgent } from '@/lib/auth/utils';

/**
 * Submits votes for a poll
 * 
 * This function handles the complete voting process for both authenticated and anonymous users.
 * It performs comprehensive validation and security checks:
 * 
 * **Validation & Security:**
 * - Validates vote input (poll ID, option IDs)
 * - Checks poll exists and is active
 * - Verifies user eligibility to vote (login requirements, existing votes)
 * - Enforces poll settings (single vs multiple votes)
 * - Prevents duplicate voting for anonymous users (IP-based)
 * - Prevents duplicate voting for authenticated users (user ID-based)
 * 
 * **Vote Tracking:**
 * - For authenticated users: tracks by user ID
 * - For anonymous users: tracks by IP address and user agent
 * - Records vote timestamp automatically
 * - Updates poll and option vote counts via database triggers
 * 
 * **Error Handling:**
 * - Returns specific error messages for different failure scenarios
 * - Sanitizes error messages to prevent information disclosure
 * - Logs errors for debugging while keeping user messages safe
 * 
 * @param {VoteInput} input - The vote data containing poll ID and selected option IDs
 * @param {AppUser} user - The current user (authenticated or anonymous)
 * @returns {Promise<ApiResponse<boolean>>} Success response with true or error response
 * 
 * @example
 * ```typescript
 * // Authenticated user voting
 * const result = await submitVoteOperation(
 *   { pollId: "poll-123", optionIds: ["option-1"] },
 *   authenticatedUser
 * );
 * 
 * // Anonymous user voting
 * const result = await submitVoteOperation(
 *   { pollId: "poll-123", optionIds: ["option-1", "option-2"] },
 *   anonymousUser
 * );
 * ```
 */
export async function submitVoteOperation(
  input: VoteInput,
  user: AppUser
): Promise<ApiResponse<boolean>> {
  try {
    // Validate input data to ensure it's properly formatted
    const validation = validateVoteInput(input);
    if (!validation.isValid) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid vote input',
        details: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
        context: { input }
      });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch poll details to validate it exists and check settings
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', input.pollId)
      .single();

    if (pollError) {
      // Handle specific "not found" error code
      if (pollError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', input.pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${pollError.message}`,
        'SELECT',
        'polls'
      );
    }

    // Get existing votes to check if user has already voted
    const existingVotes = await getExistingVotes(input.pollId, user);
    const clientIp = await getClientIp();

    // Validate vote eligibility based on poll settings and existing votes
    const eligibility = validateVoteEligibility(poll, user, existingVotes, clientIp);
    if (!eligibility.canVote) {
      return createErrorResponse({
        code: 'VOTE_ELIGIBILITY_ERROR',
        message: eligibility.errors.join(', '),
        details: 'User is not eligible to vote on this poll',
        timestamp: new Date().toISOString(),
        context: { pollId: input.pollId, userId: user.id, clientIp }
      });
    }

    // Enforce poll settings - check if multiple votes are allowed
    if (!poll.allow_multiple_votes && input.optionIds.length > 1) {
      return createErrorResponse({
        code: 'VOTE_VALIDATION_ERROR',
        message: 'Multiple votes not allowed on this poll',
        details: 'This poll only allows single votes',
        timestamp: new Date().toISOString(),
        context: { pollId: input.pollId, optionIds: input.optionIds }
      });
    }

    // Get user agent for tracking anonymous votes
    const userAgent = await getUserAgent();

    // Create vote records for each selected option
    const votes = input.optionIds.map(optionId => ({
      poll_id: input.pollId,
      option_id: optionId,
      // For authenticated users, store user ID; for anonymous, store IP
      voter_id: user.isAuthenticated ? user.id : null,
      voter_ip: user.isAuthenticated ? null : clientIp,
      voter_user_agent: userAgent,
    }));

    // Insert votes into database - triggers will update vote counts automatically
    const { error: voteError } = await supabase
      .from('votes')
      .insert(votes);

    if (voteError) {
      throw createDatabaseError(
        `Failed to submit votes: ${voteError.message}`,
        'INSERT',
        'votes'
      );
    }

    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error submitting vote:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to submit vote',
      'INSERT',
      'votes'
    ));
  }
}

/**
 * Gets existing votes for a user/IP on a specific poll
 * 
 * This helper function retrieves existing votes to check for duplicate voting.
 * It handles both authenticated and anonymous users differently:
 * 
 * **For Authenticated Users:**
 * - Queries votes by user ID
 * - Returns all votes cast by the authenticated user on this poll
 * 
 * **For Anonymous Users:**
 * - Queries votes by IP address
 * - Returns all votes cast from the same IP on this poll
 * - This prevents anonymous users from voting multiple times from the same location
 * 
 * @param {string} pollId - The ID of the poll to check votes for
 * @param {AppUser} user - The current user (authenticated or anonymous)
 * @returns {Promise<any[]>} Array of existing votes or empty array if none found
 */
async function getExistingVotes(pollId: string, user: AppUser): Promise<any[]> {
  try {
    const supabase = await createServerSupabaseClient();
    
    if (user.isAuthenticated) {
      // Get votes by user ID
      const { data: votes, error } = await supabase
        .from('votes')
        .select('option_id, voter_id')
        .eq('poll_id', pollId)
        .eq('voter_id', user.id);

      if (error) {
        console.error('Error fetching user votes:', error);
        return [];
      }

      return votes || [];
    } else {
      // Get votes by IP address
      const clientIp = await getClientIp();
      const { data: votes, error } = await supabase
        .from('votes')
        .select('option_id, voter_ip')
        .eq('poll_id', pollId)
        .eq('voter_ip', clientIp);

      if (error) {
        console.error('Error fetching IP votes:', error);
        return [];
      }

      return votes || [];
    }
  } catch (error) {
    console.error('Error getting existing votes:', error);
    return [];
  }
}

/**
 * Gets user votes for a specific poll
 * 
 * This function retrieves the votes cast by a user (authenticated or anonymous) on a specific poll.
 * It's used to:
 * - Display which options the user has already selected
 * - Show voting history
 * - Enable vote editing (if allowed by poll settings)
 * - Provide user feedback on their voting status
 * 
 * **For Authenticated Users:**
 * - Returns votes by user ID
 * - Provides persistent voting history across sessions
 * 
 * **For Anonymous Users:**
 * - Returns votes by IP address
 * - Provides session-based voting history
 * - May not persist across different network locations
 * 
 * @param {string} pollId - The ID of the poll to get votes for
 * @param {AppUser} user - The current user (authenticated or anonymous)
 * @returns {Promise<ApiResponse<string[]>>} Success response with array of option IDs or error response
 * 
 * @example
 * ```typescript
 * const result = await getUserVotesOperation("poll-123", currentUser);
 * if (result.success) {
 *   const votedOptions = result.data; // ["option-1", "option-3"]
 *   console.log(`User voted on ${votedOptions.length} options`);
 * }
 * ```
 */
export async function getUserVotesOperation(
  pollId: string,
  user: AppUser
): Promise<ApiResponse<string[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    let votes: any[] = [];

    if (user.isAuthenticated) {
      // Get votes by user ID
      const { data: userVotes, error } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('voter_id', user.id);

      if (error) {
        throw createDatabaseError(
          `Failed to fetch user votes: ${error.message}`,
          'SELECT',
          'votes'
        );
      }

      votes = userVotes || [];
    } else {
      // Get votes by IP address
      const clientIp = await getClientIp();
      const { data: ipVotes, error } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('voter_ip', clientIp);

      if (error) {
        throw createDatabaseError(
          `Failed to fetch IP votes: ${error.message}`,
          'SELECT',
          'votes'
        );
      }

      votes = ipVotes || [];
    }

    const optionIds = votes.map(vote => vote.option_id);
    return createSuccessResponse(optionIds);
  } catch (error) {
    console.error('Error getting user votes:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to get user votes',
      'SELECT',
      'votes'
    ));
  }
}

/**
 * Gets all votes for a specific poll (for admin purposes)
 */
export async function getPollVotesOperation(
  pollId: string,
  user: AppUser
): Promise<ApiResponse<any[]>> {
  try {
    // Only allow poll authors or admins to see all votes
    if (!user.isAuthenticated) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'Authentication required to view poll votes',
        details: 'Only poll authors can view all votes',
        timestamp: new Date().toISOString(),
        context: { pollId, userId: user.id }
      });
    }

    const supabase = await createServerSupabaseClient();

    // Check if user is the poll author
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('author_id')
      .eq('id', pollId)
      .single();

    if (pollError) {
      if (pollError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${pollError.message}`,
        'SELECT',
        'polls'
      );
    }

    if (poll.author_id !== user.id) {
      return createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'You can only view votes for your own polls',
        details: 'Access denied to poll votes',
        timestamp: new Date().toISOString(),
        context: { pollId, userId: user.id, pollAuthorId: poll.author_id }
      });
    }

    // Get all votes for the poll
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        *,
        poll_options (text),
        profiles (name)
      `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (votesError) {
      throw createDatabaseError(
        `Failed to fetch poll votes: ${votesError.message}`,
        'SELECT',
        'votes'
      );
    }

    return createSuccessResponse(votes || []);
  } catch (error) {
    console.error('Error getting poll votes:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to get poll votes',
      'SELECT',
      'votes'
    ));
  }
}

/**
 * Removes a user's vote from a poll
 */
export async function removeVoteOperation(
  pollId: string,
  optionId: string,
  user: AppUser
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createServerSupabaseClient();

    let deleteQuery = supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('option_id', optionId);

    if (user.isAuthenticated) {
      deleteQuery = deleteQuery.eq('voter_id', user.id);
    } else {
      const clientIp = await getClientIp();
      deleteQuery = deleteQuery.eq('voter_ip', clientIp);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      throw createDatabaseError(
        `Failed to remove vote: ${deleteError.message}`,
        'DELETE',
        'votes'
      );
    }

    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error removing vote:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to remove vote',
      'DELETE',
      'votes'
    ));
  }
}

/**
 * Gets voting statistics for a poll
 */
export async function getPollVotingStatsOperation(
  pollId: string
): Promise<ApiResponse<any>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get poll with options and vote counts
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          text,
          votes,
          order_index
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError) {
      if (pollError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${pollError.message}`,
        'SELECT',
        'polls'
      );
    }

    // Calculate statistics
    const totalVotes = poll.total_votes || 0;
    const options = poll.poll_options || [];
    
    const stats = {
      pollId,
      totalVotes,
      options: options.map((option: any) => ({
        id: option.id,
        text: option.text,
        votes: option.votes || 0,
        percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
        orderIndex: option.order_index
      })),
      createdAt: poll.created_at,
      endDate: poll.end_date,
      status: poll.status,
      allowMultipleVotes: poll.allow_multiple_votes,
      requireLogin: poll.require_login
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error getting poll voting stats:', error);
    if ((error as any)?.code && (error as any).code.startsWith('DATABASE_ERROR')) {
      return createErrorResponse(error as any);
    }
    return createErrorResponse(createDatabaseError(
      'Failed to get poll voting stats',
      'SELECT',
      'polls'
    ));
  }
}
