# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `polling-app` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
5. Click "Create new project"

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Configure Environment Variables

1. Create a `.env.local` file in your project root:
```bash
touch .env.local
```

2. Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Configure the following:

### Site URL
- Set to `http://localhost:3000` for development
- Set to your production URL for deployment

### Redirect URLs
Add these URLs to the "Redirect URLs" list:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/polls`
- `http://localhost:3000/`

### Email Templates (Optional)
1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 5. Test Authentication

1. Start your development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000`
3. Try creating an account and signing in
4. Check that protected routes work correctly

## 6. Database Schema (Future)

When you're ready to add database functionality, you'll need to create tables for:
- `polls` - Store poll information
- `poll_options` - Store poll options
- `votes` - Store user votes
- `profiles` - Store user profile information

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Make sure you're using the `anon` key, not the `service_role` key
   - Check that your environment variables are correctly set

2. **Redirect errors**
   - Ensure your redirect URLs are properly configured in Supabase
   - Check that your site URL matches your development environment

3. **Email not received**
   - Check your spam folder
   - Verify email templates are configured
   - Check Supabase logs for email delivery issues

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Documentation](https://nextjs.org/docs)
