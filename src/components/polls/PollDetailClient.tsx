"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Lock, Share2, BarChart3, Calendar, User } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { PollWithOptions } from "@/lib/types/database";
import { voteOnPollServer } from "@/lib/actions/vote";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PollDetailClientProps {
  poll: PollWithOptions;
  user: SupabaseUser | null;
  userVotes: string[];
}

export default function PollDetailClient({ poll, user, userVotes }: PollDetailClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [hasVoted, setHasVoted] = useState(userVotes.length > 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isLoggedIn = !!user;
  const isPollEnded = poll.end_date ? new Date(poll.end_date) < new Date() : false;
  const canVote = !isPollEnded && (!poll.require_login || isLoggedIn);

  const handleOptionToggle = (optionId: string) => {
    if (!canVote || hasVoted) return;

    if (poll.allow_multiple_votes) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      const { success, error: voteError } = await voteOnPollServer(poll.id, selectedOptions);
      
      if (voteError) {
        setError(voteError.message);
        return;
      }

      if (success) {
        setHasVoted(true);
        // Refresh the page to get updated vote counts
        router.refresh();
      }
    } catch (err) {
      setError("Failed to vote on poll");
      console.error('Error voting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVotePercentage = (votes: number) => {
    return poll.total_votes > 0 ? Math.round((votes / poll.total_votes) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sharePoll = () => {
    const url = `${window.location.origin}/polls/${poll.id}`;
    if (navigator.share) {
      navigator.share({
        title: poll.title,
        text: poll.description || 'Check out this poll!',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert('Poll link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Poll Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={poll.author.avatar_url || undefined} />
                  <AvatarFallback>{poll.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  by {poll.author.name}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(poll.created_at)}
                </span>
              </div>
              
              <CardTitle className="text-2xl mb-2">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-base">
                  {poll.description}
                </CardDescription>
              )}
            </div>
            
            <Button variant="outline" size="sm" onClick={sharePoll}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Poll Stats */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {poll.total_votes} total votes
            </Badge>
            
            {poll.require_login && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Login Required
              </Badge>
            )}
            
            {poll.allow_multiple_votes && (
              <Badge variant="outline">
                Multiple Votes Allowed
              </Badge>
            )}
            
            {poll.end_date && (
              <Badge variant={isPollEnded ? "destructive" : "secondary"} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isPollEnded ? "Ended" : "Ends"} {formatDate(poll.end_date)}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Poll Options */}
      <Card>
        <CardHeader>
          <CardTitle>Vote Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.poll_options.map((option) => {
            const percentage = getVotePercentage(option.votes);
            const isSelected = selectedOptions.includes(option.id);
            const isVoted = userVotes.includes(option.id);
            
            return (
              <div
                key={option.id}
                className={`relative p-4 border rounded-lg transition-all ${
                  canVote && !hasVoted ? "cursor-pointer hover:border-primary/50 hover:bg-accent/50" : ""
                } ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                } ${
                  isVoted ? "bg-green-50 border-green-200" : ""
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                {poll.allow_multiple_votes && canVote && !hasVoted && (
                  <Checkbox
                    checked={isSelected}
                    className="absolute top-4 right-4"
                    disabled
                  />
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-lg">{option.text}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Voted Indicator */}
                {isVoted && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="bg-green-600">
                      ✓ Voted
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Voting Section */}
      <div className="mt-6">
        {!hasVoted && canVote && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              size="lg"
              className="flex-1"
            >
              {isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}
            </Button>
            
            {!isLoggedIn && poll.require_login && (
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  Sign In to Vote
                </Button>
              </Link>
            )}
          </div>
        )}
        
        {!canVote && poll.require_login && !isLoggedIn && (
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to vote on this poll.
            </p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        )}
        
        {!canVote && isPollEnded && (
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Poll Has Ended</h3>
            <p className="text-muted-foreground">
              This poll ended on {formatDate(poll.end_date!)}
            </p>
          </div>
        )}
        
        {hasVoted && (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-600 mb-2">✓</div>
            <h3 className="text-lg font-medium text-green-800 mb-2">Vote Submitted!</h3>
            <p className="text-green-700">
              Thank you for voting on this poll.
            </p>
          </div>
        )}
      </div>

      {/* Back to Polls */}
      <div className="mt-8 text-center">
        <Link href="/polls">
          <Button variant="outline">
            ← Back to All Polls
          </Button>
        </Link>
      </div>
    </div>
  );
}
