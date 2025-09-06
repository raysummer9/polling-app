# Polling App

A modern, secure polling application built with Next.js 15, TypeScript, and Supabase. Create polls, collect votes, and analyze results with a beautiful, responsive interface.

## 🚀 Features

### Core Functionality
- 🔐 **User Authentication** - Secure sign up, sign in, and sign out with Supabase Auth
- 📊 **Create Polls** - Create polls with multiple options, custom settings, and end dates
- 🗳️ **Vote on Polls** - Vote on polls with single or multiple selection support
- 👤 **Anonymous Voting** - Support for both authenticated and anonymous voting
- 📈 **Real-time Results** - Live voting results with percentage calculations
- 🔗 **Share Polls** - Share polls via unique URLs and QR codes

### Poll Management
- ⚙️ **Flexible Settings** - Configure multiple votes, login requirements, and end dates
- 📊 **Dashboard** - Comprehensive dashboard for managing your polls
- ✏️ **Edit Polls** - Update poll details and options after creation
- 🗑️ **Delete Polls** - Remove polls with confirmation dialogs
- 📊 **Analytics** - View vote counts and engagement metrics

### Security & Performance
- 🛡️ **Rate Limiting** - Protection against DoS attacks
- 🔒 **CSRF Protection** - Cross-site request forgery prevention
- 🔐 **Row Level Security** - Database-level authorization with RLS policies
- 🚫 **Input Validation** - Comprehensive input sanitization and validation
- 📝 **Error Sanitization** - Safe error messages without information disclosure
- ⏱️ **Session Management** - Enhanced session handling with timeouts

### User Experience
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui components
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode Ready** - Built with Tailwind CSS for easy theming
- ⚡ **Fast Loading** - Server-side rendering and optimized performance
- 🔄 **Real-time Updates** - Live voting results and status updates

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Radix UI** - Accessible UI primitives

### Backend & Database
- **Supabase** - Backend as a Service (Auth + Database)
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Database-level authorization
- **Real-time Subscriptions** - Live data updates

### Security & Infrastructure
- **Rate Limiting** - In-memory rate limiting for API protection
- **CSRF Protection** - Server-side token validation
- **Input Validation** - Comprehensive data validation and sanitization
- **Error Handling** - Standardized error responses with sanitization
- **Session Management** - Enhanced authentication and session handling

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (recommended: use `.nvmrc` file)
- **npm** or **yarn** package manager
- **Supabase account** (free tier available)

### 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/raysummer9/polling-app.git
cd polling-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to **Settings > API**
   - Copy your **Project URL** and **anon/public key**
   - Go to **SQL Editor** and run the schema from `database/schema.sql`

4. **Create environment variables:**
```bash
cp .env.local.example .env.local
```

5. **Add your Supabase credentials to `.env.local`:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# Optional: Custom configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. **Run the development server:**
```bash
npm run dev
```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🗄️ Database Setup

1. **Run the main schema:**
   ```sql
   -- In Supabase SQL Editor
   \i database/schema.sql
   ```

2. **Apply security enhancements (optional):**
   ```sql
   -- For enhanced RLS policies
   \i database/enhanced-rls-policies.sql
   ```

3. **Fix vote counting (if needed):**
   ```sql
   -- For anonymous voting bug fixes
   \i database/fix-vote-trigger.sql
   ```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── auth/                    # Authentication pages (login, register)
│   ├── create-poll/             # Poll creation page
│   ├── dashboard/               # User dashboard page
│   ├── polls/                   # Poll browsing and detail pages
│   ├── profile/                 # User profile pages
│   ├── api/                     # API routes (CSRF tokens, etc.)
│   └── layout.tsx               # Root layout with AuthProvider
├── components/                  # React components
│   ├── auth/                    # Authentication forms
│   ├── dashboard/               # Dashboard management components
│   ├── layout/                  # Layout components (Header, etc.)
│   ├── polls/                   # Poll-related components
│   └── ui/                      # shadcn/ui components
├── contexts/                    # React contexts
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utility libraries and business logic
│   ├── actions/                 # Next.js Server Actions
│   ├── api/                     # API client functions
│   ├── auth/                    # Authentication utilities
│   ├── operations/              # Business logic operations
│   ├── security/                # Security features (CSRF, rate limiting)
│   ├── supabase/                # Supabase client configurations
│   ├── types/                   # TypeScript type definitions
│   ├── validation/              # Input validation and sanitization
│   └── utils.ts                 # General utility functions
├── hooks/                       # Custom React hooks
└── database/                    # Database schema and migrations
    ├── schema.sql               # Main database schema
    ├── enhanced-rls-policies.sql # Enhanced security policies
    └── fix-vote-trigger.sql     # Vote counting fixes
```

## 🔐 Authentication Flow

### User Registration & Login
1. **Sign Up**: Users create accounts with email/password
2. **Email Verification**: Supabase sends verification emails (if enabled)
3. **Sign In**: Users authenticate with verified accounts
4. **Session Management**: Automatic session handling with secure cookies
5. **Profile Creation**: User profiles are automatically created in the database

### Route Protection
- **Middleware**: Automatically redirects unauthenticated users
- **Server Components**: Server-side authentication checks
- **Client Components**: Real-time authentication state management
- **API Routes**: Protected endpoints with session validation

### Anonymous Access
- **Public Polls**: Users can vote without logging in (if poll allows)
- **IP Tracking**: Anonymous votes are tracked by IP address
- **Session Persistence**: Anonymous voting state maintained during session

## 🗳️ Usage Examples

### Creating a Poll
```typescript
// Server Action
const result = await createPollServer({
  title: "What's your favorite programming language?",
  description: "Choose your preferred language for web development",
  options: ["JavaScript", "TypeScript", "Python", "Go"],
  allowMultipleVotes: false,
  requireLogin: true,
  endDate: "2024-12-31T23:59:59Z"
});
```

### Voting on a Poll
```typescript
// Authenticated user voting
const result = await voteOnPollServer("poll-id", ["option-id-1"]);

// Anonymous user voting (if poll allows)
const result = await voteOnPollServer("poll-id", ["option-id-1", "option-id-2"]);
```

### Getting Poll Results
```typescript
// Get poll with results
const { poll } = await getPollByIdServer("poll-id");
console.log(`Total votes: ${poll.total_votes}`);

// Get user's votes
const { votes } = await getUserVotesServer("poll-id");
console.log(`User voted on: ${votes.join(', ')}`);
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: API and database interaction testing
- **Component Tests**: React component testing with React Testing Library
- **Security Tests**: Authentication and authorization testing

## 🚀 Deployment

### Environment Variables
```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SECRET_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Migration
1. Run the main schema in your production Supabase instance
2. Apply any additional migrations as needed
3. Verify RLS policies are properly configured

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci      # Run tests for CI

# Database
npm run db:setup     # Set up database schema
npm run db:migrate   # Run database migrations
```

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting (if configured)
- **Conventional Commits**: Use conventional commit messages

### Architecture Patterns
- **Server Components**: For data fetching and server-side rendering
- **Client Components**: For interactivity and state management
- **Server Actions**: For form submissions and mutations
- **Modular Design**: Separation of concerns with clear boundaries
- **Type Safety**: Comprehensive TypeScript coverage

## 🛡️ Security Features

### Implemented Security Measures
- **Rate Limiting**: Prevents DoS attacks and abuse
- **CSRF Protection**: Prevents cross-site request forgery
- **Input Validation**: Comprehensive data validation and sanitization
- **Error Sanitization**: Safe error messages without information disclosure
- **Row Level Security**: Database-level authorization with RLS policies
- **Session Management**: Enhanced authentication with timeout handling
- **Secure Headers**: Security headers via middleware

### Security Best Practices
- Never expose sensitive data in client-side code
- Always validate and sanitize user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Regular security audits and dependency updates

## 📚 Documentation

### Additional Documentation
- **[Security Implementation Guide](SECURITY_IMPLEMENTATION.md)** - Detailed security features
- **[Testing Guide](TESTING_README.md)** - Testing setup and best practices
- **[Database Schema](database/schema.sql)** - Complete database structure
- **[Node.js Upgrade Guide](NODE_UPGRADE.md)** - Node.js version management

### API Documentation
- **Server Actions**: Documented in `src/lib/actions/`
- **API Routes**: Documented in `src/app/api/`
- **Type Definitions**: Comprehensive types in `src/lib/types/`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the code style and add tests
4. **Run tests**: `npm test` to ensure everything works
5. **Commit changes**: Use conventional commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Submit a pull request**: Provide a clear description of changes

### Contribution Guidelines
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Supabase Team** - For the excellent backend platform
- **Vercel Team** - For shadcn/ui components
- **Tailwind CSS** - For the utility-first CSS framework
- **Open Source Community** - For all the amazing tools and libraries

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
