import { Database } from './database';

// Base types from database
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Extended types for business logic
export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
  author_profile?: Profile;
}

export interface PollWithVotes extends PollWithOptions {
  user_votes: string[];
  total_votes: number;
}

// Input types for operations
export interface CreatePollInput {
  title: string;
  description: string;
  options: string[];
  allowMultipleVotes: boolean;
  requireLogin: boolean;
  endDate?: string;
}

export interface UpdatePollInput {
  title?: string;
  description?: string;
  allowMultipleVotes?: boolean;
  requireLogin?: boolean;
  endDate?: string;
  status?: 'active' | 'ended' | 'draft';
}

export interface UpdatePollOptionsInput {
  options: Array<{ id?: string; text: string; orderIndex: number }>;
}

export interface VoteInput {
  pollId: string;
  optionIds: string[];
}

// Response types
export interface PollResponse<T = PollWithOptions> {
  data: T | null;
  error: Error | null;
}

export interface PollsResponse<T = PollWithOptions> {
  data: T[];
  error: Error | null;
}

export interface VoteResponse {
  success: boolean;
  error: Error | null;
}

export interface UserVotesResponse {
  votes: string[];
  error: Error | null;
}

// Validation types
export interface PollValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface VoteValidationResult {
  canVote: boolean;
  errors: string[];
  warnings: string[];
}

// Filter and pagination types
export interface PollFilters {
  status?: 'active' | 'ended' | 'draft';
  authorId?: string;
  requireLogin?: boolean;
  allowMultipleVotes?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PollPagination {
  page: number;
  limit: number;
  total: number;
}

export interface PollsQueryResult {
  polls: PollWithOptions[];
  pagination: PollPagination;
  error: Error | null;
}
