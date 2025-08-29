# Polling App

A modern polling application built with Next.js 15, TypeScript, and Supabase for authentication and data storage.

## Features

- 🔐 **User Authentication** - Sign up, sign in, and sign out with Supabase Auth
- 📊 **Create Polls** - Create polls with multiple options, settings, and end dates
- 🗳️ **Vote on Polls** - Vote on polls with single or multiple selection
- 🛡️ **Protected Routes** - Middleware-based route protection
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui components
- 📱 **Responsive Design** - Works perfectly on desktop and mobile

## Poll Settings

- **Multiple Options** - Allow users to select multiple poll options
- **Login Required** - Require users to be logged in to vote
- **End Date** - Set optional end dates for polls
- **Real-time Updates** - Live voting results and status

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/raysummer9/polling-app.git
cd polling-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API
   - Copy your Project URL and anon/public key

4. Create environment variables:
```bash
cp .env.local.example .env.local
```

5. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── create-poll/       # Poll creation page
│   ├── polls/             # Polls browsing page
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # React components
│   ├── auth/              # Authentication forms
│   ├── layout/            # Layout components
│   ├── polls/             # Poll-related components
│   └── ui/                # shadcn/ui components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client configurations
│   └── utils.ts           # Utility functions
└── hooks/                 # Custom React hooks
```

## Authentication Flow

1. **Sign Up**: Users can create accounts with email/password
2. **Email Verification**: Supabase sends verification emails
3. **Sign In**: Users can sign in with verified accounts
4. **Protected Routes**: Middleware redirects unauthenticated users
5. **Session Management**: Automatic session handling with cookies

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Supabase** - Backend as a Service (Auth + Database)
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Radix UI** - Accessible UI primitives

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
