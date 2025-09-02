import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          ascending: jest.fn(),
          descending: jest.fn(),
        })),
      })),
      order: jest.fn(() => ({
        ascending: jest.fn(),
        descending: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
}

// Mock createClient function
export const mockCreateClient = jest.fn(() => mockSupabaseClient)

// Test data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

export const mockPoll = {
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'Test poll description',
  author_id: 'test-user-id',
  status: 'active',
  allow_multiple_votes: false,
  require_login: false,
  end_date: null,
  total_votes: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockPollOption = {
  id: 'test-option-id',
  poll_id: 'test-poll-id',
  text: 'Test Option',
  votes: 0,
  order_index: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockVote = {
  id: 'test-vote-id',
  poll_id: 'test-poll-id',
  option_id: 'test-option-id',
  voter_id: 'test-user-id',
  voter_ip: null,
  voter_user_agent: 'jest-test-agent',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockProfile = {
  id: 'test-user-id',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Helper function to reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks()
  mockSupabaseClient.auth.getUser.mockReset()
  mockSupabaseClient.from.mockReset()
}

// Helper function to setup successful auth response
export const setupAuthSuccess = (user = mockUser) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
}

// Helper function to setup failed auth response
export const setupAuthFailure = (error = { message: 'Auth failed' }) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error,
  })
}

// Helper function to setup anonymous user
export const setupAnonymousUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}
