"use client";

import { useState, useEffect } from "react";
import PollCard from "@/components/polls/PollCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { PollWithOptions } from "@/lib/types/database";
import { voteOnPollServer, getUserVotesServer } from "@/lib/actions/vote";
import { getPolls } from "@/lib/api/polls";

interface PollsClientProps {
  initialPolls: PollWithOptions[];
  initialUserVotes: Record<string, string[]>;
  user: User | null;
  error?: string;
}

export default function PollsClient({ initialPolls, initialUserVotes, user, error: initialError }: PollsClientProps) {
  const [polls, setPolls] = useState<PollWithOptions[]>(initialPolls);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>(initialUserVotes);

  const isLoggedIn = !!user;

  useEffect(() => {
    // Only fetch user votes if we don't have them already
    if (Object.keys(userVotes).length === 0) {
      fetchUserVotes();
    }
  }, [polls, isLoggedIn]);

  const fetchUserVotes = async () => {
    if (!polls.length) return;
    
    try {
      const votesMap: Record<string, string[]> = {};
      for (const poll of polls) {
        const { votes } = await getUserVotesServer(poll.id);
        votesMap[poll.id] = votes;
      }
      setUserVotes(votesMap);
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  };

  const refreshPolls = async () => {
    try {
      setLoading(true);
      const { polls: fetchedPolls, error: pollsError } = await getPolls();
      
      if (pollsError) {
        setError(pollsError.message);
        return;
      }

      if (fetchedPolls) {
        setPolls(fetchedPolls);
        
        // Refresh user votes after updating polls
        const votesMap: Record<string, string[]> = {};
        for (const poll of fetchedPolls) {
          const { votes } = await getUserVotesServer(poll.id);
          votesMap[poll.id] = votes;
        }
        setUserVotes(votesMap);
      }
    } catch (err) {
      setError("Failed to fetch polls");
      console.error('Error fetching polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      const { success, error: voteError } = await voteOnPollServer(pollId, optionIds);
      
      if (voteError) {
        setError(voteError.message);
        throw new Error(voteError.message);
      }

      if (success) {
        // Always refresh polls to get updated vote counts and user votes
        await refreshPolls();
      }
    } catch (err) {
      setError("Failed to vote on poll");
      console.error('Error voting:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input placeholder="Search polls..." />
        </div>
        <Select defaultValue="recent">
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="votes">Most Votes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={{
              id: poll.id,
              title: poll.title,
              description: poll.description || '',
              options: poll.poll_options.map(opt => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
              })),
              totalVotes: poll.total_votes,
              createdAt: poll.created_at,
              author: {
                name: poll.author.name,
                avatar: poll.author.avatar_url || undefined
              },
              allowMultipleVotes: poll.allow_multiple_votes,
              requireLogin: poll.require_login,
              endDate: poll.end_date || undefined,
              isVoted: poll.require_login ? userVotes[poll.id]?.length > 0 : userVotes[poll.id]?.length > 0
            }}
            isLoggedIn={isLoggedIn}
            onVote={handleVote}
          />
        ))}
      </div>



      {polls.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No polls found
          </h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a poll and start gathering opinions!
          </p>
          {isLoggedIn ? (
            <Link href="/create-poll">
              <Button>Create Your First Poll</Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button>Sign In to Create Polls</Button>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
