'use server';

import { 
  createPollOperation,
  getPollByIdOperation,
  getPollsOperation,
  updatePollOperation,
  updatePollOptionsOperation,
  deletePollOperation
} from '@/lib/operations/polls';
import { 
  submitVoteOperation,
  getUserVotesOperation,
  getPollVotingStatsOperation
} from '@/lib/operations/voting';
import { getCurrentUser } from '@/lib/auth/utils';
import { 
  CreatePollInput, 
  UpdatePollInput, 
  UpdatePollOptionsInput,
  VoteInput,
  PollFilters,
  PollPagination
} from '@/lib/types/poll';
import { isSuccessResponse, sanitizeErrorMessage } from '@/lib/types/error';
import { withCSRFProtection } from '@/lib/security/csrf';
import { validateSessionForSensitiveOperation } from '@/lib/security/session';
import { withRateLimit } from '@/lib/security/rate-limiter';

/**
 * Creates a new poll with enhanced security
 */
export const createPollServer = withCSRFProtection(
  withRateLimit(
    async (input: CreatePollInput) => {
      try {
        // Enhanced session validation for sensitive operations
        const { user } = await validateSessionForSensitiveOperation();
        
        const result = await createPollOperation(input, (user as { id: string }).id);
        
        if (isSuccessResponse(result)) {
          return {
            success: true,
            poll: result.data,
            error: null
          };
        } else {
          const sanitized = sanitizeErrorMessage(result.error, 'createPoll', true);
          return {
            success: false,
            error: sanitized.message
          };
        }
      } catch (error) {
        console.error('Error in createPollServer:', error);
        const sanitized = sanitizeErrorMessage(error, 'createPoll', true);
        return {
          success: false,
          error: sanitized.message
        };
      }
    },
    'polls',
    'create'
  ),
  true // Require session
);

/**
 * Gets a poll by ID
 */
export async function getPollByIdServer(pollId: string) {
  try {
    const result = await getPollByIdOperation(pollId);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        poll: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        poll: null,
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getPollByIdServer:', error);
    return {
      success: false,
      poll: null,
      error: 'Failed to fetch poll'
    };
  }
}

/**
 * Gets multiple polls with filtering and pagination
 */
export async function getPollsServer(
  filters: PollFilters = {},
  pagination: Partial<PollPagination> = {}
) {
  try {
    const result = await getPollsOperation(filters, pagination);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        polls: result.data.polls,
        pagination: result.data.pagination,
        error: null
      };
    } else {
      return {
        success: false,
        polls: [],
        pagination: { page: 1, limit: 10, total: 0 },
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getPollsServer:', error);
    return {
      success: false,
      polls: [],
      pagination: { page: 1, limit: 10, total: 0 },
      error: 'Failed to fetch polls'
    };
  }
}

/**
 * Updates a poll
 */
export async function updatePollServer(
  pollId: string,
  input: UpdatePollInput
) {
  try {
    const user = await getCurrentUser();
    
    if (!user.isAuthenticated) {
      return {
        success: false,
        error: 'Authentication required to update polls'
      };
    }

    const result = await updatePollOperation(pollId, input, user.id);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        poll: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in updatePollServer:', error);
    return {
      success: false,
      error: 'Failed to update poll'
    };
  }
}

/**
 * Updates poll options
 */
export async function updatePollOptionsServer(
  pollId: string,
  input: UpdatePollOptionsInput
) {
  try {
    const user = await getCurrentUser();
    
    if (!user.isAuthenticated) {
      return {
        success: false,
        error: 'Authentication required to update poll options'
      };
    }

    const result = await updatePollOptionsOperation(pollId, input, user.id);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        poll: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in updatePollOptionsServer:', error);
    return {
      success: false,
      error: 'Failed to update poll options'
    };
  }
}

/**
 * Deletes a poll with enhanced security
 */
export const deletePollServer = withCSRFProtection(
  withRateLimit(
    async (pollId: string) => {
      try {
        // Enhanced session validation for sensitive operations
        const { user } = await validateSessionForSensitiveOperation();

        const result = await deletePollOperation(pollId, (user as { id: string }).id);
        
        if (isSuccessResponse(result)) {
          return {
            success: true,
            error: null
          };
        } else {
          const sanitized = sanitizeErrorMessage(result.error, 'deletePoll', true);
          return {
            success: false,
            error: sanitized.message
          };
        }
      } catch (error) {
        console.error('Error in deletePollServer:', error);
        const sanitized = sanitizeErrorMessage(error, 'deletePoll', true);
        return {
          success: false,
          error: sanitized.message
        };
      }
    },
    'polls',
    'delete'
  ),
  true // Require session
);

/**
 * Submits votes for a poll with enhanced security
 */
export const voteOnPollServer = withCSRFProtection(
  withRateLimit(
    async (pollId: string, optionIds: string[]) => {
      try {
        const user = await getCurrentUser();
        const input: VoteInput = { pollId, optionIds };

        const result = await submitVoteOperation(input, user);
        
        if (isSuccessResponse(result)) {
          return {
            success: true,
            error: null
          };
        } else {
          const sanitized = sanitizeErrorMessage(result.error, 'voteOnPoll', true);
          return {
            success: false,
            error: sanitized.message
          };
        }
      } catch (error) {
        console.error('Error in voteOnPollServer:', error);
        const sanitized = sanitizeErrorMessage(error, 'voteOnPoll', true);
        return {
          success: false,
          error: sanitized.message
        };
      }
    },
    'polls',
    'vote'
  ),
  false // Don't require session for anonymous voting
);

/**
 * Gets user votes for a specific poll
 */
export async function getUserVotesServer(pollId: string) {
  try {
    const user = await getCurrentUser();
    const result = await getUserVotesOperation(pollId, user);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        votes: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        votes: [],
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getUserVotesServer:', error);
    return {
      success: false,
      votes: [],
      error: 'Failed to get user votes'
    };
  }
}

/**
 * Gets voting statistics for a poll
 */
export async function getPollVotingStatsServer(pollId: string) {
  try {
    const result = await getPollVotingStatsOperation(pollId);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        stats: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        stats: null,
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getPollVotingStatsServer:', error);
    return {
      success: false,
      stats: null,
      error: 'Failed to get poll voting statistics'
    };
  }
}

/**
 * Gets user polls (polls created by the current user)
 */
export async function getUserPollsServer() {
  try {
    const user = await getCurrentUser();
    
    if (!user.isAuthenticated) {
      return {
        success: false,
        polls: [],
        error: 'Authentication required to view user polls'
      };
    }

    const filters: PollFilters = { authorId: user.id };
    const result = await getPollsOperation(filters);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        polls: result.data.polls,
        error: null
      };
    } else {
      return {
        success: false,
        polls: [],
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getUserPollsServer:', error);
    return {
      success: false,
      polls: [],
      error: 'Failed to fetch user polls'
    };
  }
}

/**
 * Gets user votes with IP address for server-side operations
 * This is a legacy function for backward compatibility
 */
export async function getUserVotesWithIpServer(pollId: string) {
  try {
    const user = await getCurrentUser();
    const result = await getUserVotesOperation(pollId, user);
    
    if (isSuccessResponse(result)) {
      return {
        success: true,
        votes: result.data,
        error: null
      };
    } else {
      return {
        success: false,
        votes: [],
        error: result.error.message
      };
    }
  } catch (error) {
    console.error('Error in getUserVotesWithIpServer:', error);
    return {
      success: false,
      votes: [],
      error: 'Failed to get user votes'
    };
  }
}
