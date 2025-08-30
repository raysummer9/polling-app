import { Suspense } from "react";
import PollsClient from "@/components/polls/PollsClient";
import { getPollsServer, getUserVotesWithIpServer } from "@/lib/api/polls-server";
import { createClient } from "@/lib/supabase/server";

export default async function PollsPage() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Get polls
  const { polls, error: pollsError } = await getPollsServer();
  
  if (pollsError) {
    console.error('Error fetching polls:', pollsError);
  }

  // Get user votes for each poll
  const userVotes: Record<string, string[]> = {};
  if (polls) {
    for (const poll of polls) {
      const { votes } = await getUserVotesWithIpServer(poll.id);
      userVotes[poll.id] = votes;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Polls</h1>
          <p className="text-muted-foreground mt-2">
            Discover and vote on polls created by the community
          </p>
        </div>
        {user && (
          <a href="/create-poll" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Create New Poll
          </a>
        )}
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        </div>
      }>
        <PollsClient 
          initialPolls={polls || []} 
          initialUserVotes={userVotes}
          user={user}
          error={pollsError?.message}
        />
      </Suspense>
    </div>
  );
}
