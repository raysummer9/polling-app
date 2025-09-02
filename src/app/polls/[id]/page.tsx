import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPollByIdServer } from '@/lib/api/polls-server';
import { getUserVotesWithIpServer } from '@/lib/api/polls-server';
import PollDetailClient from '@/components/polls/PollDetailClient';

interface PollDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Get poll details
  const { poll, error: pollError } = await getPollByIdServer(id);
  
  if (pollError || !poll) {
    notFound();
  }

  // Get user votes for this poll
  const { votes: userVotes } = await getUserVotesWithIpServer(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <PollDetailClient 
        poll={poll}
        user={user}
        userVotes={userVotes}
      />
    </div>
  );
}
