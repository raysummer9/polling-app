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
 */
export async function submitVoteOperation(
  input: VoteInput,
  user: AppUser
): Promise<ApiResponse<boolean>> {
  try {
    // Validate input
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

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', input.pollId)
      .single();

    if (pollError) {
      if (pollError.code === 'PGRST116') {
        return createErrorResponse(createNotFoundError('poll', input.pollId));
      }
      throw createDatabaseError(
        `Failed to fetch poll: ${pollError.message}`,
        'SELECT',
        'polls'
      );
    }

    // Get existing votes for eligibility check
    const existingVotes = await getExistingVotes(input.pollId, user);
    const clientIp = await getClientIp();

    // Validate vote eligibility
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

    // Check if multiple votes are allowed
    if (!poll.allow_multiple_votes && input.optionIds.length > 1) {
      return createErrorResponse({
        code: 'VOTE_VALIDATION_ERROR',
        message: 'Multiple votes not allowed on this poll',
        details: 'This poll only allows single votes',
        timestamp: new Date().toISOString(),
        context: { pollId: input.pollId, optionIds: input.optionIds }
      });
    }

    // Get user agent
    const userAgent = await getUserAgent();

    // Create votes
    const votes = input.optionIds.map(optionId => ({
      poll_id: input.pollId,
      option_id: optionId,
      voter_id: user.isAuthenticated ? user.id : null,
      voter_ip: user.isAuthenticated ? null : clientIp,
      voter_user_agent: userAgent,
    }));

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
