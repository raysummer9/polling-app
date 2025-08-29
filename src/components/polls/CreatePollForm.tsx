"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface CreatePollFormProps {
  onSubmit?: (pollData: PollData) => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
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
          <div className="space-y-2">
            <Label htmlFor="title">Poll Question</Label>
            <Input
              id="title"
              placeholder="What would you like to ask?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
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
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0"
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
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if you want the poll to run indefinitely
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={!isValid} className="w-full">
            Create Poll
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
