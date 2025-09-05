// Re-export database types
export * from './database';

// Re-export new modular types (excluding conflicting types)
export type {
  CreatePollInput,
  UpdatePollInput,
  UpdatePollOptionsInput,
  VoteInput,
  PollFilters,
  PollPagination,
  PollWithOptions,
  PollWithVotes,
  PollValidationResult,
  VoteValidationResult,
  PollResponse,
  PollsResponse,
  VoteResponse,
  UserVotesResponse,
  PollsQueryResult
} from './poll';

export type {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  ErrorResponse,
  SuccessResponse
} from './error';

export type {
  AppUser,
  AuthenticatedUser,
  AnonymousUser,
  UserPermissions
} from './auth';

// Legacy types for backward compatibility
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  isVoted?: boolean;
  userVote?: string; // optionId that user voted for
}

export interface CreatePollData {
  title: string;
  description: string;
  options: string[];
  allowMultipleVotes: boolean;
  requireLogin: boolean;
  endDate?: string;
}

export interface VoteData {
  pollId: string;
  optionIds: string[]; // Updated to support multiple votes
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Helper function to convert database types to legacy types
export function convertPollFromDatabase(dbPoll: unknown, dbOptions: unknown[], dbAuthor: unknown): Poll {
  const poll = dbPoll as Record<string, unknown>;
  const author = dbAuthor as Record<string, unknown>;
  
  return {
    id: poll.id as string,
    title: poll.title as string,
    description: (poll.description as string) || '',
    options: dbOptions.map(opt => {
      const option = opt as Record<string, unknown>;
      return {
        id: option.id as string,
        text: option.text as string,
        votes: option.votes as number
      };
    }),
    totalVotes: poll.total_votes as number,
    createdAt: poll.created_at as string,
    updatedAt: poll.updated_at as string,
    authorId: poll.author_id as string,
    author: {
      id: author.id as string,
      name: author.name as string,
      email: (author.email as string) || '',
      avatar: author.avatar_url as string,
      createdAt: author.created_at as string,
      updatedAt: author.updated_at as string
    }
  };
}
