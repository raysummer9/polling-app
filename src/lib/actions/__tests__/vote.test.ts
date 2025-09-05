// Mock the Supabase client first
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        error: null,
      })),
    })),
  })),
}))

import { voteOnPollServer, getUserVotesServer } from '../polls'

describe('voteOnPollServer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow authenticated user to vote on a poll', async () => {
    // Mock successful authentication
    const mockSupabase = require('@/lib/supabase/server').createClient()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    // Mock poll fetch
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-poll-id',
          status: 'active',
          require_login: false,
          allow_multiple_votes: false,
          end_date: null,
        },
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValue(mockPollQuery)

    // Mock existing votes check (no existing votes)
    const mockVotesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(mockPollQuery)
    mockSupabase.from.mockReturnValueOnce(mockVotesQuery)

    // Mock vote insertion
    const mockInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(mockPollQuery)
    mockSupabase.from.mockReturnValueOnce(mockVotesQuery)
    mockSupabase.from.mockReturnValueOnce(mockInsertQuery)

    const result = await voteOnPollServer('test-poll-id', ['test-option-id'])

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return error when poll is not found', async () => {
    // Mock successful authentication
    const mockSupabase = require('@/lib/supabase/server').createClient()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    // Mock poll fetch failure
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' },
      }),
    }
    mockSupabase.from.mockReturnValue(mockPollQuery)

    const result = await voteOnPollServer('non-existent-poll-id', ['test-option-id'])

    expect(result.success).toBe(false)
    expect(result.error).toContain('Poll not found')
  })

  it('should return error when poll is not active', async () => {
    // Mock successful authentication
    const mockSupabase = require('@/lib/supabase/server').createClient()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    // Mock poll fetch with inactive status
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-poll-id',
          status: 'ended',
          require_login: false,
          allow_multiple_votes: false,
          end_date: null,
        },
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValue(mockPollQuery)

    const result = await voteOnPollServer('test-poll-id', ['test-option-id'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('Poll is not active')
  })
})

describe('getUserVotesServer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user votes for authenticated user', async () => {
    // Mock successful authentication
    const mockSupabase = require('@/lib/supabase/server').createClient()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    // Mock votes fetch
    const mockVotesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: [
          { option_id: 'option-1' },
          { option_id: 'option-2' },
        ],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValue(mockVotesQuery)

    const result = await getUserVotesServer('test-poll-id')

    expect(result.votes).toEqual(['option-1', 'option-2'])
    expect(result.error).toBeNull()
  })

  it('should return empty array when user has not voted', async () => {
    // Mock successful authentication
    const mockSupabase = require('@/lib/supabase/server').createClient()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    // Mock empty votes fetch
    const mockVotesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValue(mockVotesQuery)

    const result = await getUserVotesServer('test-poll-id')

    expect(result.votes).toEqual([])
    expect(result.error).toBeNull()
  })
})
