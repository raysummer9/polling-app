"use client";

import CreatePollForm from "@/components/polls/CreatePollForm";

export default function CreatePollPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create a New Poll</h1>
          <p className="text-muted-foreground mt-2">
            Share your question with the community and gather opinions
          </p>
        </div>
        
        <CreatePollForm
          onSubmit={(pollData) => {
            console.log("Creating poll:", pollData);
            // TODO: Implement poll creation logic
          }}
        />
      </div>
    </div>
  );
}
