"use client";

import PollCard from "@/components/polls/PollCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

// Sample data for demonstration
const samplePolls = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Let's see which programming language is most popular among developers.",
    options: [
      { id: "1-1", text: "JavaScript", votes: 45 },
      { id: "1-2", text: "Python", votes: 38 },
      { id: "1-3", text: "TypeScript", votes: 32 },
      { id: "1-4", text: "Rust", votes: 15 },
    ],
    totalVotes: 130,
    createdAt: "2024-01-15",
    author: {
      name: "John Doe",
      avatar: "/avatars/john.jpg",
    },
    allowMultipleVotes: false,
    requireLogin: true,
    endDate: "2024-12-31T23:59:59",
  },
  {
    id: "2",
    title: "Which frameworks do you use for web development?",
    description: "Select all the frameworks you currently use or have used in the past.",
    options: [
      { id: "2-1", text: "React", votes: 52 },
      { id: "2-2", text: "Vue", votes: 28 },
      { id: "2-3", text: "Angular", votes: 20 },
      { id: "2-4", text: "Svelte", votes: 12 },
      { id: "2-5", text: "Next.js", votes: 35 },
    ],
    totalVotes: 147,
    createdAt: "2024-01-14",
    author: {
      name: "Jane Smith",
      avatar: "/avatars/jane.jpg",
    },
    allowMultipleVotes: true,
    requireLogin: false,
    endDate: "2024-06-30T23:59:59",
  },
  {
    id: "3",
    title: "What's your preferred coffee type?",
    description: "A simple poll about coffee preferences - no login required!",
    options: [
      { id: "3-1", text: "Espresso", votes: 25 },
      { id: "3-2", text: "Cappuccino", votes: 30 },
      { id: "3-3", text: "Latte", votes: 35 },
      { id: "3-4", text: "Americano", votes: 20 },
    ],
    totalVotes: 110,
    createdAt: "2024-01-13",
    author: {
      name: "Coffee Lover",
      avatar: "/avatars/coffee.jpg",
    },
    allowMultipleVotes: false,
    requireLogin: false,
    // No end date - runs indefinitely
  },
];

export default function PollsPage() {
  // TODO: Get actual login status from auth context
  const isLoggedIn = false; // This should come from your auth context

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Polls</h1>
          <p className="text-muted-foreground mt-2">
            Discover and vote on polls created by the community
          </p>
        </div>
        <Link href="/create-poll">
          <Button>Create New Poll</Button>
        </Link>
      </div>

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
        {samplePolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            isLoggedIn={isLoggedIn}
            onVote={(pollId, optionIds) => {
              console.log(`Voted on poll ${pollId}, options:`, optionIds);
              // TODO: Implement voting logic
            }}
          />
        ))}
      </div>

      {samplePolls.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No polls found
          </h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a poll and start gathering opinions!
          </p>
          <Link href="/create-poll">
            <Button>Create Your First Poll</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
