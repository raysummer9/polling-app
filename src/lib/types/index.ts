// Re-export database types
export * from './database';

// Re-export new modular types
export * from './poll';
export * from './error';
export * from './auth';

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
export function convertPollFromDatabase(dbPoll: any, dbOptions: any[], dbAuthor: any): Poll {
  return {
    id: dbPoll.id,
    title: dbPoll.title,
    description: dbPoll.description || '',
    options: dbOptions.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes
    })),
    totalVotes: dbPoll.total_votes,
    createdAt: dbPoll.created_at,
    updatedAt: dbPoll.updated_at,
    authorId: dbPoll.author_id,
    author: {
      id: dbAuthor.id,
      name: dbAuthor.name,
      email: dbAuthor.email || '',
      avatar: dbAuthor.avatar_url,
      createdAt: dbAuthor.created_at,
      updatedAt: dbAuthor.updated_at
    }
  };
}
