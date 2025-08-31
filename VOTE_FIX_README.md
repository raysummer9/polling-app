# Anonymous Voting Bug Fix

## Issue Description

The polling app has a bug where anonymous votes are being submitted successfully (stored in the database with IP tracking) but the vote counts are not updating on the frontend. The user sees a "Vote Submitted!" message and their selected option shows a "✓ Voted" badge, but the vote count remains at 0.

## Root Cause

The issue is caused by **Row Level Security (RLS) policies** blocking the database trigger function that updates vote counts. When a vote is inserted into the `votes` table, a trigger function `update_poll_total_votes()` should automatically update the vote counts in the `polls` and `poll_options` tables. However, this trigger function is being blocked by RLS policies because it runs with the same security context as the user who triggered it.

## Solution

The fix involves making the trigger function `SECURITY DEFINER`, which allows it to run with the privileges of the function creator (typically the database owner) rather than the calling user. This bypasses RLS policies for the vote counting updates.

## Files Modified

1. **`database/schema.sql`** - Updated the trigger function to be `SECURITY DEFINER`
2. **`database/fix-vote-trigger.sql`** - Comprehensive fix script for existing databases
3. **`database/test-vote-fix.sql`** - Test script to verify the fix works

## How to Apply the Fix

### For New Databases
If you're setting up a new database, the updated `schema.sql` file already includes the fix.

### For Existing Databases
Run the fix script in your Supabase SQL editor:

```sql
-- Run the contents of database/fix-vote-trigger.sql
```

This script will:
1. Drop the existing trigger
2. Recreate the function with `SECURITY DEFINER`
3. Recreate the trigger
4. Add RLS policies to allow vote count updates
5. Recalculate vote counts for existing polls

## Verification

After applying the fix, you can verify it works by:

1. **Testing anonymous voting** - Create a poll that doesn't require login and vote anonymously
2. **Checking vote counts** - Verify that the vote counts update immediately after voting
3. **Running the test script** - Use `database/test-vote-fix.sql` to verify the trigger function

## Technical Details

### Before Fix
```sql
CREATE OR REPLACE FUNCTION update_poll_total_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Function body
END;
$$ language 'plpgsql';  -- Runs with user privileges, blocked by RLS
```

### After Fix
```sql
CREATE OR REPLACE FUNCTION update_poll_total_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Function body
END;
$$ language 'plpgsql' SECURITY DEFINER;  -- Runs with owner privileges, bypasses RLS
```

## Why This Happens

1. **Vote Insertion**: User submits a vote → Vote is inserted into `votes` table
2. **Trigger Fires**: `update_vote_counts` trigger fires on INSERT
3. **Function Execution**: `update_poll_total_votes()` function tries to update vote counts
4. **RLS Block**: RLS policies block the update because the function runs with user context
5. **Silent Failure**: Update fails silently, vote counts don't change
6. **Frontend Shows Old Data**: Frontend displays cached/stale vote counts

## Prevention

To prevent similar issues in the future:
- Always use `SECURITY DEFINER` for trigger functions that need to bypass RLS
- Test both authenticated and anonymous voting flows
- Add proper error handling and logging to trigger functions
- Consider using database views or materialized views for vote counts

## Testing Checklist

- [ ] Anonymous voting updates vote counts immediately
- [ ] Authenticated voting still works correctly
- [ ] Multiple votes per poll work (if enabled)
- [ ] Vote counts are accurate after page refresh
- [ ] No duplicate votes are allowed per IP/user
- [ ] Error messages are displayed correctly for invalid votes
