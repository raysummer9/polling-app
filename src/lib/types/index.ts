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
}

export interface VoteData {
  pollId: string;
  optionId: string;
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
