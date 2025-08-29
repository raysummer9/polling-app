# PollApp - Modern Polling Application

A modern, responsive polling application built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn UI components.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Create Polls**: Intuitive interface for creating polls with multiple options
- **Vote on Polls**: Real-time voting with visual progress indicators
- **Browse Polls**: Discover and search through community-created polls
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful interface built with Shadcn UI components

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Context API
- **Authentication**: Custom auth service (ready for backend integration)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── polls/             # Polls listing page
│   ├── create-poll/       # Create poll page
│   ├── profile/           # User profile page (placeholder)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── polls/             # Poll-related components
│   │   ├── PollCard.tsx
│   │   └── CreatePollForm.tsx
│   ├── layout/            # Layout components
│   │   └── Header.tsx
│   └── ui/                # Shadcn UI components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   │   └── auth.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── utils.ts           # General utilities
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
└── contexts/              # React contexts (placeholder)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd polling-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Available Routes

- `/` - Home page with app overview
- `/auth/login` - User login page
- `/auth/register` - User registration page
- `/polls` - Browse all polls
- `/create-poll` - Create a new poll
- `/profile` - User profile (placeholder)

## 🎨 Components Overview

### Authentication Components
- **LoginForm**: Handles user login with email and password
- **RegisterForm**: Handles user registration with form validation

### Poll Components
- **PollCard**: Displays individual polls with voting functionality
- **CreatePollForm**: Form for creating new polls with dynamic options

### Layout Components
- **Header**: Navigation header with user menu and authentication status

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Shadcn UI

The project uses Shadcn UI components. To add new components:

```bash
npx shadcn@latest add <component-name>
```

## 🚧 TODO

- [ ] Implement backend API integration
- [ ] Add database connectivity (Prisma/TypeORM)
- [ ] Implement real-time voting with WebSockets
- [ ] Add user profile management
- [ ] Implement poll categories and tags
- [ ] Add search and filtering functionality
- [ ] Implement poll sharing features
- [ ] Add analytics and insights
- [ ] Implement email notifications
- [ ] Add dark mode support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icons
