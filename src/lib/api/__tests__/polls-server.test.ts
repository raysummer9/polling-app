import { 
  getUserPollsServer,
  getPollsServer,
  getUserVotesWithIpServer,
  getPollByIdServer
} from '../polls-server'
import { 
  mockSupabaseClient, 
  mockCreateClient, 
  mockUser, 
  mockPoll, 
  mockPollOption, 
  mockVote,
  mockProfile,
  resetMocks,
  setupAuthSuccess,
  setupAuthFailure,
  setupAnonymousUser
} from '@/lib/test-utils'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

describe('getUserPollsServer', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch user polls successfully', async () => {
    const mockUserPolls = [
      { 
        ...mockPoll, 
        poll_options: [mockPollOption],
        author: mockProfile
      },
    ]

    const mockPollsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      descending: jest.fn().mockResolvedValue({
        data: mockUserPolls,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollsQuery)

    const result = await getUserPollsServer('test-user-id')

    expect(result.polls).toEqual(mockUserPolls)
    expect(result.error).toBeNull()
  })

  it('should return error when user polls fetch fails', async () => {
    const mockPollsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      descending: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollsQuery)

    const result = await getUserPollsServer('test-user-id')

    expect(result.polls).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch user polls')
  })
})

describe('getPollsServer', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch active polls successfully', async () => {
    const mockPolls = [
      { 
        ...mockPoll, 
        poll_options: [mockPollOption],
        author: mockProfile
      },
    ]

    const mockPollsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      descending: jest.fn().mockResolvedValue({
        data: mockPolls,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollsQuery)

    const result = await getPollsServer()

    expect(result.polls).toEqual(mockPolls)
    expect(result.error).toBeNull()
  })

  it('should return error when polls fetch fails', async () => {
    const mockPollsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      descending: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollsQuery)

    const result = await getPollsServer()

    expect(result.polls).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch polls')
  })
})

describe('getUserVotesWithIpServer', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('authenticated user scenarios', () => {
    it('should return user votes for authenticated user', async () => {
      setupAuthSuccess()
      
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
      mockSupabaseClient.from.mockReturnValue(mockVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual(['option-1', 'option-2'])
      expect(result.error).toBeNull()
    })

    it('should return empty array when user has not voted', async () => {
      setupAuthSuccess()
      
      const mockVotesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should return error when vote fetch fails', async () => {
      setupAuthSuccess()
      
      const mockVotesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual([])
      expect(result.error?.message).toContain('Failed to fetch user votes')
    })
  })

  describe('anonymous user scenarios', () => {
    it('should return IP votes for anonymous user', async () => {
      setupAnonymousUser()
      
      const mockIpVotesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: [
            { option_id: 'option-1' },
          ],
          error: null,
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockIpVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual(['option-1'])
      expect(result.error).toBeNull()
    })

    it('should return empty array when IP has not voted', async () => {
      setupAnonymousUser()
      
      const mockIpVotesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockIpVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should return empty array when IP is unknown', async () => {
      setupAnonymousUser()
      
      // Mock headers to return unknown IP
      jest.doMock('next/headers', () => ({
        headers: jest.fn(() => new Map([
          ['x-forwarded-for', 'unknown'],
          ['x-real-ip', 'unknown'],
          ['user-agent', 'jest-test-agent'],
        ])),
      }))

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should return error when IP vote fetch fails', async () => {
      setupAnonymousUser()
      
      const mockIpVotesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockIpVotesQuery)

      const result = await getUserVotesWithIpServer('test-poll-id')

      expect(result.votes).toEqual([])
      expect(result.error?.message).toContain('Failed to fetch IP votes')
    })
  })
})

describe('getPollByIdServer', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch a poll by ID successfully', async () => {
    const mockPollWithOptions = {
      ...mockPoll,
      poll_options: [mockPollOption],
      author: mockProfile,
    }

    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPollWithOptions,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await getPollByIdServer('test-poll-id')

    expect(result.poll).toEqual(mockPollWithOptions)
    expect(result.error).toBeNull()
  })

  it('should return error when poll is not found', async () => {
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await getPollByIdServer('non-existent-poll-id')

    expect(result.poll).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch poll')
  })

  it('should return error when poll fetch fails', async () => {
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await getPollByIdServer('test-poll-id')

    expect(result.poll).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch poll')
  })
})
