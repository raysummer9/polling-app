"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { createPoll } from "@/lib/api/polls";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePollFormProps {
  onSubmit?: (pollData: any) => void;
}

interface PollData {
  title: string;
  description: string;
  options: string[];
  allowMultipleVotes: boolean;
  requireLogin: boolean;
  endDate?: string;
}

export default function CreatePollForm({ onSubmit }: CreatePollFormProps) {
  const [formData, setFormData] = useState<PollData>({
    title: "",
    description: "",
    options: ["", ""], // Start with 2 empty options
    allowMultipleVotes: false,
    requireLogin: true,
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to create a poll");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Filter out empty options
      const validOptions = formData.options.filter(opt => opt.trim());
      
      if (validOptions.length < 2) {
        setError("You must provide at least 2 options");
        setLoading(false);
        return;
      }

      const { poll, error: createError } = await createPoll({
        title: formData.title.trim(),
        description: formData.description.trim(),
        options: validOptions,
        allowMultipleVotes: formData.allowMultipleVotes,
        requireLogin: formData.requireLogin,
        endDate: formData.endDate || undefined,
      });

      if (createError) {
        setError(createError.message);
      } else if (poll) {
        // Call the onSubmit callback if provided
        if (onSubmit) {
          onSubmit(poll);
        }
        
        // Redirect to the polls page
        router.push('/polls');
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error('Error creating poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ""],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const isValid = formData.title.trim() && 
                 formData.options.filter(opt => opt.trim()).length >= 2;

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Login Required
            </h3>
            <p className="text-muted-foreground mb-4">
              You must be logged in to create polls.
            </p>
            <Button onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
        <CardDescription>
          Share your question with the community and gather opinions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Poll Question</Label>
            <Input
              id="title"
              placeholder="What would you like to ask?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about your poll..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poll Options</Label>
              <Badge variant="secondary">
                {formData.options.filter(opt => opt.trim()).length} options
              </Badge>
            </div>
            
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    required
                    disabled={loading}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
              disabled={loading}
            >
              Add Option
            </Button>
          </div>

          {/* Poll Settings Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Poll Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowMultipleVotes"
                  checked={formData.allowMultipleVotes}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, allowMultipleVotes: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="allowMultipleVotes" className="text-sm font-normal">
                  Allow users to select multiple options
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireLogin"
                  checked={formData.requireLogin}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, requireLogin: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="requireLogin" className="text-sm font-normal">
                  Require users to be logged in to vote
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Poll End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if you want the poll to run indefinitely
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={!isValid || loading} className="w-full">
            {loading ? "Creating Poll..." : "Create Poll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
