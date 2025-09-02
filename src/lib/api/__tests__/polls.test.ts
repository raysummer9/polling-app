import { 
  createPoll, 
  getPolls, 
  getPollById, 
  voteOnPoll, 
  getUserVotes,
  getUserPolls,
  updatePoll,
  updatePollOptions,
  deletePoll
} from '../polls'
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
jest.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}))

describe('createPoll', () => {
  beforeEach(() => {
    resetMocks()
  })

  const pollData = {
    title: 'Test Poll',
    description: 'Test poll description',
    options: ['Option 1', 'Option 2', 'Option 3'],
    allowMultipleVotes: false,
    requireLogin: true,
    endDate: '2024-12-31',
  }

  it('should create a poll successfully', async () => {
    setupAuthSuccess()
    
    // Mock profile check (profile exists)
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)

    // Mock poll creation
    const mockPollInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPoll,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockPollInsertQuery)

    // Mock poll options creation
    const mockOptionsInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockPollInsertQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockOptionsInsertQuery)

    const result = await createPoll(pollData)

    expect(result.poll).toEqual(mockPoll)
    expect(result.error).toBeNull()
  })

  it('should create a profile if it does not exist', async () => {
    setupAuthSuccess()
    
    // Mock profile check (profile does not exist)
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)

    // Mock profile creation
    const mockProfileInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileInsertQuery)

    // Mock poll creation
    const mockPollInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPoll,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileInsertQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockPollInsertQuery)

    // Mock poll options creation
    const mockOptionsInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileInsertQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockPollInsertQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockOptionsInsertQuery)

    const result = await createPoll(pollData)

    expect(result.poll).toEqual(mockPoll)
    expect(result.error).toBeNull()
  })

  it('should return error when user is not authenticated', async () => {
    setupAuthFailure()

    const result = await createPoll(pollData)

    expect(result.poll).toBeNull()
    expect(result.error?.message).toBe('User not authenticated')
  })

  it('should return error when poll creation fails', async () => {
    setupAuthSuccess()
    
    // Mock profile check
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)

    // Mock poll creation failure
    const mockPollInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockPollInsertQuery)

    const result = await createPoll(pollData)

    expect(result.poll).toBeNull()
    expect(result.error?.message).toContain('Failed to create poll')
  })
})

describe('getPolls', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch polls successfully', async () => {
    const mockPolls = [
      { ...mockPoll, poll_options: [mockPollOption] },
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

    const result = await getPolls()

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

    const result = await getPolls()

    expect(result.polls).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch polls')
  })
})

describe('getPollById', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch a poll by ID successfully', async () => {
    const mockPollWithOptions = {
      ...mockPoll,
      poll_options: [mockPollOption],
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

    const result = await getPollById('test-poll-id')

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

    const result = await getPollById('non-existent-poll-id')

    expect(result.poll).toBeNull()
    expect(result.error?.message).toContain('Poll not found')
  })
})

describe('voteOnPoll', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should allow authenticated user to vote', async () => {
    setupAuthSuccess()
    
    // Mock poll fetch
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPoll,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    // Mock vote insertion
    const mockVoteInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockVoteInsertQuery)

    const result = await voteOnPoll('test-poll-id', ['test-option-id'])

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return error when poll is not found', async () => {
    setupAuthSuccess()
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await voteOnPoll('non-existent-poll-id', ['test-option-id'])

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Poll not found')
  })

  it('should return error when poll is not active', async () => {
    setupAuthSuccess()
    
    const inactivePoll = { ...mockPoll, status: 'ended' }
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: inactivePoll,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await voteOnPoll('test-poll-id', ['test-option-id'])

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Poll is not active')
  })

  it('should return error when login is required but user is not authenticated', async () => {
    setupAnonymousUser()
    
    const loginRequiredPoll = { ...mockPoll, require_login: true }
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: loginRequiredPoll,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await voteOnPoll('test-poll-id', ['test-option-id'])

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Login required to vote on this poll')
  })
})

describe('getUserVotes', () => {
  beforeEach(() => {
    resetMocks()
  })

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

    const result = await getUserVotes('test-poll-id')

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

    const result = await getUserVotes('test-poll-id')

    expect(result.votes).toEqual([])
    expect(result.error).toBeNull()
  })
})

describe('getUserPolls', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should fetch user polls successfully', async () => {
    setupAuthSuccess()
    
    const mockUserPolls = [
      { ...mockPoll, poll_options: [mockPollOption] },
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

    const result = await getUserPolls('test-user-id')

    expect(result.polls).toEqual(mockUserPolls)
    expect(result.error).toBeNull()
  })

  it('should return error when user polls fetch fails', async () => {
    setupAuthSuccess()
    
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

    const result = await getUserPolls('test-user-id')

    expect(result.polls).toBeNull()
    expect(result.error?.message).toContain('Failed to fetch user polls')
  })
})

describe('updatePoll', () => {
  beforeEach(() => {
    resetMocks()
  })

  const updates = {
    title: 'Updated Poll Title',
    description: 'Updated description',
    allow_multiple_votes: true,
    require_login: false,
    end_date: '2024-12-31',
  }

  it('should update poll successfully', async () => {
    setupAuthSuccess()
    
    // Mock poll ownership check
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { author_id: 'test-user-id' },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)

    // Mock poll update
    const mockUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { ...mockPoll, ...updates },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQuery)

    const result = await updatePoll('test-poll-id', updates)

    expect(result.poll).toEqual({ ...mockPoll, ...updates })
    expect(result.error).toBeNull()
  })

  it('should return error when user is not authenticated', async () => {
    setupAuthFailure()

    const result = await updatePoll('test-poll-id', updates)

    expect(result.poll).toBeNull()
    expect(result.error?.message).toBe('User not authenticated')
  })

  it('should return error when poll is not found', async () => {
    setupAuthSuccess()
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await updatePoll('test-poll-id', updates)

    expect(result.poll).toBeNull()
    expect(result.error?.message).toContain('Poll not found')
  })

  it('should return error when user does not own the poll', async () => {
    setupAuthSuccess()
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { author_id: 'different-user-id' },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await updatePoll('test-poll-id', updates)

    expect(result.poll).toBeNull()
    expect(result.error?.message).toBe('You can only update your own polls')
  })
})

describe('updatePollOptions', () => {
  beforeEach(() => {
    resetMocks()
  })

  const options = [
    { id: 'option-1', text: 'Updated Option 1' },
    { id: 'option-2', text: 'Updated Option 2' },
  ]

  it('should update poll options successfully', async () => {
    setupAuthSuccess()
    
    // Mock poll ownership check
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { author_id: 'test-user-id' },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)

    // Mock options update
    const mockUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: options,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQuery)

    const result = await updatePollOptions('test-poll-id', options)

    expect(result.options).toEqual(options)
    expect(result.error).toBeNull()
  })

  it('should return error when user is not authenticated', async () => {
    setupAuthFailure()

    const result = await updatePollOptions('test-poll-id', options)

    expect(result.options).toBeNull()
    expect(result.error?.message).toBe('User not authenticated')
  })
})

describe('deletePoll', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should delete poll successfully', async () => {
    setupAuthSuccess()
    
    // Mock poll ownership check
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { author_id: 'test-user-id' },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)

    // Mock poll deletion
    const mockDeleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValueOnce(mockPollQuery)
    mockSupabaseClient.from.mockReturnValueOnce(mockDeleteQuery)

    const result = await deletePoll('test-poll-id')

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return error when user is not authenticated', async () => {
    setupAuthFailure()

    const result = await deletePoll('test-poll-id')

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('User not authenticated')
  })

  it('should return error when poll is not found', async () => {
    setupAuthSuccess()
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' },
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await deletePoll('test-poll-id')

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Poll not found')
  })

  it('should return error when user does not own the poll', async () => {
    setupAuthSuccess()
    
    const mockPollQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { author_id: 'different-user-id' },
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockPollQuery)

    const result = await deletePoll('test-poll-id')

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('You can only delete your own polls')
  })
})
