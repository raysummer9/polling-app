"use client";

import { useState, useEffect } from "react";
import PollCard from "@/components/polls/PollCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getPolls, voteOnPoll, getUserVotes } from "@/lib/api/polls";
import { PollWithOptions } from "@/lib/types/database";

export default function PollsPage() {
  const { user, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});

  const isLoggedIn = !!user;

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const { polls: fetchedPolls, error: pollsError } = await getPolls();
      
      if (pollsError) {
        setError(pollsError.message);
        return;
      }

      if (fetchedPolls) {
        setPolls(fetchedPolls);
        
        // Fetch user votes for each poll if logged in
        if (isLoggedIn) {
          const votesMap: Record<string, string[]> = {};
          for (const poll of fetchedPolls) {
            const { votes } = await getUserVotes(poll.id);
            votesMap[poll.id] = votes;
          }
          setUserVotes(votesMap);
        }
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
      const { success, error: voteError } = await voteOnPoll(pollId, optionIds);
      
      if (voteError) {
        setError(voteError.message);
        return;
      }

      if (success) {
        // Update user votes locally
        setUserVotes(prev => ({
          ...prev,
          [pollId]: optionIds
        }));
        
        // Refresh polls to get updated vote counts
        await fetchPolls();
      }
    } catch (err) {
      setError("Failed to vote on poll");
      console.error('Error voting:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        </div>
      </div>
    );
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
        {isLoggedIn && (
          <Link href="/create-poll">
            <Button>Create New Poll</Button>
          </Link>
        )}
      </div>

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
              updatedAt: poll.updated_at,
              authorId: poll.author_id,
              author: {
                id: poll.author.id,
                name: poll.author.name,
                email: '',
                avatar: poll.author.avatar_url,
                createdAt: poll.author.created_at || '',
                updatedAt: poll.author.updated_at || ''
              },
              allowMultipleVotes: poll.allow_multiple_votes,
              requireLogin: poll.require_login,
              endDate: poll.end_date,
              isVoted: userVotes[poll.id]?.length > 0
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
    </div>
  );
}
