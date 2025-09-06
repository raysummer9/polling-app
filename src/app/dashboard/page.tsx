import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserPollsServer } from '@/lib/api/polls-server';
import DashboardPolls from '@/components/dashboard/DashboardPolls';

/**
 * User Dashboard Page Component
 * 
 * This is the main dashboard page where users can manage their polls.
 * It provides:
 * - Authentication verification (redirects to login if not authenticated)
 * - Poll management interface
 * - Performance tracking for user's polls
 * - Quick access to poll creation and editing
 * 
 * The page is server-rendered and:
 * - Fetches user authentication status
 * - Loads user's polls on the server
 * - Passes data to client components for interactivity
 * - Handles authentication redirects
 * 
 * @returns {Promise<JSX.Element>} The dashboard page component
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Verify user authentication - redirect to login if not authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch user's polls from the server
  // This provides initial data for the dashboard without client-side loading
  const { polls, error: pollsError } = await getUserPollsServer(user.id);

  if (pollsError) {
    console.error('Error fetching user polls:', pollsError);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard header with title and description */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your polls and track their performance
        </p>
      </div>

      {/* Main dashboard component with user's polls */}
      <DashboardPolls 
        initialPolls={polls || []} 
        userId={user.id}
        error={pollsError?.message}
      />
    </div>
  );
}
