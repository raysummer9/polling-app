"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Lock } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  author: {
    name: string;
    avatar?: string;
  };
  isVoted?: boolean;
  allowMultipleVotes?: boolean;
  requireLogin?: boolean;
  endDate?: string;
}

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionIds: string[]) => void;
  isLoggedIn?: boolean;
}

export default function PollCard({ poll, onVote, isLoggedIn = false }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(poll.isVoted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if poll has ended
  const isPollEnded = poll.endDate ? new Date(poll.endDate) < new Date() : false;
  
  // Check if user can vote (logged in if required, and poll hasn't ended)
  const canVote = !isPollEnded && (!poll.requireLogin || isLoggedIn);

  const handleOptionToggle = (optionId: string) => {
    if (!canVote || hasVoted) return;

    if (poll.allowMultipleVotes) {
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
    if (selectedOptions.length > 0 && onVote) {
      setIsSubmitting(true);
      try {
        await onVote(poll.id, selectedOptions);
        // For polls that require login, we can track if user voted
        if (poll.requireLogin) {
          setHasVoted(true);
        } else {
          // For anonymous polls, show temporary success message
          setHasVoted(true);
          // Reset after a short delay to allow for poll refresh
          setTimeout(() => {
            setHasVoted(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Vote failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getVotePercentage = (votes: number) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  const formatEndDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={poll.author.avatar} />
              <AvatarFallback>{poll.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{poll.author.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            {poll.requireLogin && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>Login Required</span>
              </Badge>
            )}
            {poll.endDate && (
              <Badge variant={isPollEnded ? "destructive" : "secondary"} className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{isPollEnded ? "Ended" : "Ends"}</span>
              </Badge>
            )}
            <Badge variant="secondary">
              {poll.totalVotes} votes
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{poll.title}</CardTitle>
        <CardDescription>{poll.description}</CardDescription>
        {poll.endDate && (
          <p className="text-xs text-muted-foreground">
            {isPollEnded ? "Ended on " : "Ends on "}{formatEndDate(poll.endDate)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {poll.options.map((option) => {
            const percentage = getVotePercentage(option.votes);
            const isSelected = selectedOptions.includes(option.id);
            
            return (
              <div
                key={option.id}
                className={`relative p-3 border rounded-lg transition-colors ${
                  canVote && !hasVoted ? "cursor-pointer hover:border-primary/50" : ""
                } ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                {poll.allowMultipleVotes && canVote && !hasVoted && (
                  <Checkbox
                    checked={isSelected}
                    className="absolute top-3 right-3"
                    readOnly
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                {hasVoted && (
                  <div className="absolute inset-0 bg-primary/10 rounded-lg" />
                )}
                <div
                  className="absolute inset-0 bg-primary/5 rounded-lg transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          })}
        </div>
        
        {!hasVoted && canVote && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Vote'}
          </Button>
        )}
        
        {!canVote && poll.requireLogin && !isLoggedIn && (
          <div className="text-center text-sm text-muted-foreground">
            Please log in to vote on this poll
          </div>
        )}
        
        {!canVote && isPollEnded && (
          <div className="text-center text-sm text-muted-foreground">
            This poll has ended
          </div>
        )}
        
        {hasVoted && poll.requireLogin && (
          <div className="text-center text-sm text-muted-foreground">
            You have voted on this poll
          </div>
        )}
        
        {hasVoted && !poll.requireLogin && (
          <div className="text-center text-sm text-green-600">
            ✓ Vote submitted successfully
          </div>
        )}
      </CardContent>
    </Card>
  );
}
