import { CreatePollInput, UpdatePollInput, UpdatePollOptionsInput, VoteInput } from '@/lib/types/poll';
import { PollValidationResult, VoteValidationResult } from '@/lib/types/poll';
import { createValidationError } from '@/lib/types/error';

/**
 * Validates poll creation input
 */
export function validateCreatePollInput(input: CreatePollInput): PollValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Title validation
  if (!input.title || input.title.trim().length === 0) {
    errors.push('Poll title is required');
    fieldErrors.title = ['Poll title is required'];
  } else if (input.title.trim().length < 3) {
    errors.push('Poll title must be at least 3 characters long');
    fieldErrors.title = ['Poll title must be at least 3 characters long'];
  } else if (input.title.trim().length > 200) {
    errors.push('Poll title must be less than 200 characters');
    fieldErrors.title = ['Poll title must be less than 200 characters'];
  }

  // Description validation
  if (input.description && input.description.trim().length > 1000) {
    errors.push('Poll description must be less than 1000 characters');
    fieldErrors.description = ['Poll description must be less than 1000 characters'];
  }

  // Options validation
  if (!input.options || input.options.length < 2) {
    errors.push('At least 2 options are required');
    fieldErrors.options = ['At least 2 options are required'];
  } else {
    const validOptions = input.options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      errors.push('At least 2 non-empty options are required');
      fieldErrors.options = ['At least 2 non-empty options are required'];
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('Poll options must be unique');
      fieldErrors.options = ['Poll options must be unique'];
    }

    // Validate individual option lengths
    input.options.forEach((option, index) => {
      if (option.trim().length === 0) {
        if (!fieldErrors.options) fieldErrors.options = [];
        fieldErrors.options.push(`Option ${index + 1} cannot be empty`);
      } else if (option.trim().length > 100) {
        if (!fieldErrors.options) fieldErrors.options = [];
        fieldErrors.options.push(`Option ${index + 1} must be less than 100 characters`);
      }
    });
  }

  // End date validation
  if (input.endDate) {
    const endDate = new Date(input.endDate);
    const now = new Date();
    
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
      fieldErrors.endDate = ['Invalid end date format'];
    } else if (endDate <= now) {
      errors.push('End date must be in the future');
      fieldErrors.endDate = ['End date must be in the future'];
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates poll update input
 */
export function validateUpdatePollInput(input: UpdatePollInput): PollValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Title validation
  if (input.title !== undefined) {
    if (input.title.trim().length === 0) {
      errors.push('Poll title cannot be empty');
      fieldErrors.title = ['Poll title cannot be empty'];
    } else if (input.title.trim().length < 3) {
      errors.push('Poll title must be at least 3 characters long');
      fieldErrors.title = ['Poll title must be at least 3 characters long'];
    } else if (input.title.trim().length > 200) {
      errors.push('Poll title must be less than 200 characters');
      fieldErrors.title = ['Poll title must be less than 200 characters'];
    }
  }

  // Description validation
  if (input.description !== undefined && input.description.trim().length > 1000) {
    errors.push('Poll description must be less than 1000 characters');
    fieldErrors.description = ['Poll description must be less than 1000 characters'];
  }

  // End date validation
  if (input.endDate !== undefined) {
    if (input.endDate === null) {
      // Allow null (no end date)
    } else {
      const endDate = new Date(input.endDate);
      const now = new Date();
      
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format');
        fieldErrors.endDate = ['Invalid end date format'];
      } else if (endDate <= now) {
        errors.push('End date must be in the future');
        fieldErrors.endDate = ['End date must be in the future'];
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates poll options update input
 */
export function validateUpdatePollOptionsInput(input: UpdatePollOptionsInput): PollValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (!input.options || input.options.length < 2) {
    errors.push('At least 2 options are required');
    fieldErrors.options = ['At least 2 options are required'];
  } else {
    const validOptions = input.options.filter(opt => opt.text.trim().length > 0);
    if (validOptions.length < 2) {
      errors.push('At least 2 non-empty options are required');
      fieldErrors.options = ['At least 2 non-empty options are required'];
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.text.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('Poll options must be unique');
      fieldErrors.options = ['Poll options must be unique'];
    }

    // Validate individual option lengths
    input.options.forEach((option, index) => {
      if (option.text.trim().length === 0) {
        if (!fieldErrors.options) fieldErrors.options = [];
        fieldErrors.options.push(`Option ${index + 1} cannot be empty`);
      } else if (option.text.trim().length > 100) {
        if (!fieldErrors.options) fieldErrors.options = [];
        fieldErrors.options.push(`Option ${index + 1} must be less than 100 characters`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates vote input
 */
export function validateVoteInput(input: VoteInput): PollValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Poll ID validation
  if (!input.pollId || input.pollId.trim().length === 0) {
    errors.push('Poll ID is required');
    fieldErrors.pollId = ['Poll ID is required'];
  }

  // Option IDs validation
  if (!input.optionIds || input.optionIds.length === 0) {
    errors.push('At least one option must be selected');
    fieldErrors.optionIds = ['At least one option must be selected'];
  } else {
    // Check for duplicate option IDs
    const uniqueOptionIds = new Set(input.optionIds);
    if (uniqueOptionIds.size !== input.optionIds.length) {
      errors.push('Cannot vote for the same option multiple times');
      fieldErrors.optionIds = ['Cannot vote for the same option multiple times'];
    }

    // Validate individual option ID format
    input.optionIds.forEach((optionId, index) => {
      if (!optionId || optionId.trim().length === 0) {
        if (!fieldErrors.optionIds) fieldErrors.optionIds = [];
        fieldErrors.optionIds.push(`Option ${index + 1} ID cannot be empty`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if a user can vote on a specific poll
 */
export function validateVoteEligibility(
  poll: any,
  user: any,
  existingVotes: any[],
  clientIp: string
): VoteValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if poll exists and is active
  if (!poll) {
    errors.push('Poll not found');
    return { canVote: false, errors, warnings };
  }

  if (poll.status !== 'active') {
    errors.push('Poll is not active');
    return { canVote: false, errors, warnings };
  }

  // Check if poll has ended
  if (poll.end_date && new Date(poll.end_date) < new Date()) {
    errors.push('Poll has ended');
    return { canVote: false, errors, warnings };
  }

  // Check if login is required
  if (poll.require_login && !user) {
    errors.push('Login required to vote on this poll');
    return { canVote: false, errors, warnings };
  }

  // Check if user has already voted
  if (user && existingVotes.some(vote => vote.voter_id === user.id)) {
    errors.push('You have already voted on this poll');
    return { canVote: false, errors, warnings };
  }

  // Check if IP has already voted (for anonymous users)
  if (!user && existingVotes.some(vote => vote.voter_ip === clientIp)) {
    errors.push('You have already voted from this IP address');
    return { canVote: false, errors, warnings };
  }

  // Check if multiple votes are allowed
  if (!poll.allow_multiple_votes && existingVotes.length > 1) {
    warnings.push('Multiple votes not allowed on this poll');
  }

  return {
    canVote: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitizes poll input data
 */
export function sanitizePollInput(input: CreatePollInput): CreatePollInput {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || '',
    options: input.options.map(opt => opt.trim()).filter(opt => opt.length > 0),
    allowMultipleVotes: input.allowMultipleVotes,
    requireLogin: input.requireLogin,
    endDate: input.endDate || undefined,
  };
}

/**
 * Sanitizes poll update input data
 */
export function sanitizePollUpdateInput(input: UpdatePollInput): UpdatePollInput {
  const sanitized: UpdatePollInput = {};

  if (input.title !== undefined) {
    sanitized.title = input.title.trim();
  }
  if (input.description !== undefined) {
    sanitized.description = input.description?.trim() || '';
  }
  if (input.allowMultipleVotes !== undefined) {
    sanitized.allowMultipleVotes = input.allowMultipleVotes;
  }
  if (input.requireLogin !== undefined) {
    sanitized.requireLogin = input.requireLogin;
  }
  if (input.endDate !== undefined) {
    sanitized.endDate = input.endDate;
  }
  if (input.status !== undefined) {
    sanitized.status = input.status;
  }

  return sanitized;
}
