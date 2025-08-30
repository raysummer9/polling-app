import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserPollsServer } from '@/lib/api/polls-server';
import DashboardPolls from '@/components/dashboard/DashboardPolls';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Get user's polls
  const { polls, error: pollsError } = await getUserPollsServer(user.id);

  if (pollsError) {
    console.error('Error fetching user polls:', pollsError);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your polls and track their performance
        </p>
      </div>

      <DashboardPolls 
        initialPolls={polls || []} 
        userId={user.id}
        error={pollsError?.message}
      />
    </div>
  );
}
