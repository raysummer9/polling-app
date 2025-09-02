import { 
  mockUser, 
  mockPoll, 
  mockPollOption, 
  mockVote, 
  mockProfile,
  resetMocks,
  setupAuthSuccess,
  setupAuthFailure,
  setupAnonymousUser
} from '../test-utils'

describe('Test Utils', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should have correct mock user data', () => {
    expect(mockUser).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    })
  })

  it('should have correct mock poll data', () => {
    expect(mockPoll).toEqual({
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
    })
  })

  it('should have correct mock poll option data', () => {
    expect(mockPollOption).toEqual({
      id: 'test-option-id',
      poll_id: 'test-poll-id',
      text: 'Test Option',
      votes: 0,
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  })

  it('should have correct mock vote data', () => {
    expect(mockVote).toEqual({
      id: 'test-vote-id',
      poll_id: 'test-poll-id',
      option_id: 'test-option-id',
      voter_id: 'test-user-id',
      voter_ip: null,
      voter_user_agent: 'jest-test-agent',
      created_at: '2024-01-01T00:00:00Z',
    })
  })

  it('should have correct mock profile data', () => {
    expect(mockProfile).toEqual({
      id: 'test-user-id',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  })

  it('should reset mocks correctly', () => {
    // This test verifies that resetMocks doesn't throw an error
    expect(() => resetMocks()).not.toThrow()
  })

  it('should setup auth success correctly', () => {
    setupAuthSuccess()
    // This test verifies that setupAuthSuccess doesn't throw an error
    expect(() => setupAuthSuccess()).not.toThrow()
  })

  it('should setup auth failure correctly', () => {
    setupAuthFailure()
    // This test verifies that setupAuthFailure doesn't throw an error
    expect(() => setupAuthFailure()).not.toThrow()
  })

  it('should setup anonymous user correctly', () => {
    setupAnonymousUser()
    // This test verifies that setupAnonymousUser doesn't throw an error
    expect(() => setupAnonymousUser()).not.toThrow()
  })
})
