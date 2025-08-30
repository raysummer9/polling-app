# Database Setup Guide

This guide will help you set up the Supabase database schema for the polling app.

## Prerequisites

- Supabase project created
- Access to Supabase dashboard
- Environment variables configured

## Step 1: Access SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Run the Schema

1. Copy the entire contents of `database/schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the schema

## Step 3: Verify Tables

After running the schema, you should see these tables in **Table Editor**:

### Tables Created:
- `profiles` - User profiles (extends auth.users)
- `polls` - Poll information
- `poll_options` - Poll options/choices
- `votes` - User votes

### Functions Created:
- `update_updated_at_column()` - Auto-updates timestamps
- `update_poll_total_votes()` - Updates vote counts
- `handle_new_user()` - Creates profile on signup
- `can_vote_on_poll()` - Checks voting eligibility

## Step 4: Test the Setup

### Create a Test Poll

```sql
-- Insert a test poll (replace with actual user ID)
INSERT INTO polls (title, description, author_id, allow_multiple_votes, require_login)
VALUES (
  'What is your favorite programming language?',
  'A simple test poll to verify the setup',
  'your-user-id-here',
  false,
  true
);

-- Get the poll ID
SELECT id FROM polls WHERE title = 'What is your favorite programming language?';

-- Insert poll options (replace poll_id with actual ID)
INSERT INTO poll_options (poll_id, text, order_index)
VALUES 
  ('poll-id-here', 'JavaScript', 1),
  ('poll-id-here', 'Python', 2),
  ('poll-id-here', 'TypeScript', 3),
  ('poll-id-here', 'Rust', 4);
```

## Step 5: Configure Row Level Security (RLS)

The schema automatically enables RLS and creates policies for:

### Profiles
- Anyone can view profiles
- Users can only update their own profile

### Polls
- Anyone can view active/ended polls
- Users can view their own polls (including drafts)
- Authenticated users can create polls
- Users can update/delete their own polls

### Poll Options
- Anyone can view poll options
- Poll authors can manage options

### Votes
- Anyone can view votes
- Users can vote based on poll settings

## Step 6: Test Authentication Flow

1. **Sign up a new user** through your app
2. **Check the profiles table** - should auto-create a profile
3. **Create a poll** through your app
4. **Verify the data** appears in the database

## Database Schema Overview

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Polls Table
```sql
polls (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES profiles(id),
  status poll_status DEFAULT 'active',
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  require_login BOOLEAN DEFAULT TRUE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Poll Options Table
```sql
poll_options (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Votes Table
```sql
votes (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  option_id UUID REFERENCES poll_options(id),
  voter_id UUID REFERENCES profiles(id),
  voter_ip INET,
  voter_user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
```

## Features Included

### Automatic Vote Counting
- Triggers automatically update poll and option vote counts
- No manual vote counting needed

### User Profile Management
- Automatic profile creation on user signup
- Profile data stored separately from auth.users

### Poll Status Management
- Active, ended, and draft statuses
- End date support for automatic poll expiration

### Security Features
- Row Level Security (RLS) enabled
- Proper access control policies
- IP-based voting for anonymous polls

### Performance Optimizations
- Indexes on frequently queried columns
- Efficient vote counting triggers
- Optimized queries for poll listings

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check that RLS policies are correctly applied
   - Verify user authentication status

2. **Profile not created on signup**
   - Check the `handle_new_user()` trigger
   - Verify auth.users table has the new user

3. **Vote counts not updating**
   - Check the `update_poll_total_votes()` trigger
   - Verify vote insertion is successful

4. **Foreign key constraint errors**
   - Ensure referenced records exist
   - Check UUID format and validity

### Useful Queries

```sql
-- Check all polls with their options
SELECT 
  p.title,
  p.description,
  p.total_votes,
  po.text as option_text,
  po.votes as option_votes
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.created_at DESC, po.order_index;

-- Check user voting history
SELECT 
  p.title,
  po.text as voted_option,
  v.created_at as voted_at
FROM votes v
JOIN polls p ON v.poll_id = p.id
JOIN poll_options po ON v.option_id = po.id
WHERE v.voter_id = 'your-user-id'
ORDER BY v.created_at DESC;

-- Check poll statistics
SELECT 
  p.title,
  p.total_votes,
  COUNT(po.id) as option_count,
  p.status,
  p.created_at
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
GROUP BY p.id, p.title, p.total_votes, p.status, p.created_at
ORDER BY p.created_at DESC;
```

## Next Steps

After setting up the database:

1. **Update your app** to use the new database types
2. **Test the full flow** - signup, create poll, vote
3. **Monitor performance** using Supabase analytics
4. **Set up backups** if needed for production

Your database is now ready to handle polls, votes, and user management! 🎉
