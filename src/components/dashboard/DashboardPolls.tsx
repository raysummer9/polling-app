"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import { PollWithOptions } from '@/lib/types/database';
import { deletePoll, updatePoll, updatePollOptions } from '@/lib/api/polls';
import { useRouter } from 'next/navigation';

interface DashboardPollsProps {
  initialPolls: PollWithOptions[];
  userId: string;
  error?: string;
}

export default function DashboardPolls({ initialPolls, userId, error }: DashboardPollsProps) {
  const [polls, setPolls] = useState<PollWithOptions[]>(initialPolls);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || '');
  const [editingPoll, setEditingPoll] = useState<PollWithOptions | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    allowMultipleVotes: false,
    requireLogin: false,
    endDate: '',
    options: [] as { id: string; text: string }[]
  });
  const router = useRouter();

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { success, error: deleteError } = await deletePoll(pollId);
      
      if (deleteError) {
        setErrorMessage(deleteError.message);
        return;
      }

      if (success) {
        setPolls(prev => prev.filter(poll => poll.id !== pollId));
        setErrorMessage('');
      }
    } catch (err) {
      setErrorMessage('Failed to delete poll');
      console.error('Error deleting poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPoll = (poll: PollWithOptions) => {
    setEditingPoll(poll);
    setEditForm({
      title: poll.title,
      description: poll.description || '',
      allowMultipleVotes: poll.allow_multiple_votes,
      requireLogin: poll.require_login,
      endDate: poll.end_date ? new Date(poll.end_date).toISOString().split('T')[0] : '',
      options: poll.poll_options.map(opt => ({ id: opt.id, text: opt.text }))
    });
  };

  const handleUpdatePoll = async () => {
    if (!editingPoll) return;

    setLoading(true);
    try {
      // Update poll details
      const { error: pollError } = await updatePoll(editingPoll.id, {
        title: editForm.title,
        description: editForm.description,
        allow_multiple_votes: editForm.allowMultipleVotes,
        require_login: editForm.requireLogin,
        end_date: editForm.endDate || null,
      });

      if (pollError) {
        setErrorMessage(pollError.message);
        return;
      }

      // Update poll options
      const { error: optionsError } = await updatePollOptions(editingPoll.id, editForm.options);

      if (optionsError) {
        setErrorMessage(optionsError.message);
        return;
      }

      // Update local state
      setPolls(prev => prev.map(poll => 
        poll.id === editingPoll.id 
          ? {
              ...poll,
              title: editForm.title,
              description: editForm.description,
              allow_multiple_votes: editForm.allowMultipleVotes,
              require_login: editForm.requireLogin,
              end_date: editForm.endDate || null,
              poll_options: poll.poll_options.map((opt, index) => ({
                ...opt,
                text: editForm.options[index]?.text || opt.text
              }))
            }
          : poll
      ));

      setEditingPoll(null);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage('Failed to update poll');
      console.error('Error updating poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOptionText = (index: number, text: string) => {
    setEditForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, text } : opt
      )
    }));
  };

  const getTotalVotes = (poll: PollWithOptions) => {
    return poll.poll_options.reduce((total, option) => total + (option.votes || 0), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isPollEnded = (poll: PollWithOptions) => {
    return poll.end_date ? new Date(poll.end_date) < new Date() : false;
  };

  if (errorMessage) {
    return (
      <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {polls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No polls yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first poll to start gathering opinions!
            </p>
            <Button onClick={() => router.push('/create-poll')}>
              Create Your First Poll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={isPollEnded(poll) ? "destructive" : "secondary"}>
                      {isPollEnded(poll) ? "Ended" : "Active"}
                    </Badge>
                    {poll.require_login && (
                      <Badge variant="outline">Login Required</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/polls/${poll.id}`)}
                      title="View Poll"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPoll(poll)}
                      title="Edit Poll"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePoll(poll.id)}
                      disabled={loading}
                      title="Delete Poll"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{poll.title}</CardTitle>
                <CardDescription>{poll.description}</CardDescription>
                {poll.end_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isPollEnded(poll) ? "Ended on " : "Ends on "}{formatDate(poll.end_date)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poll.poll_options.slice(0, 3).map((option) => (
                    <div key={option.id} className="flex justify-between text-sm">
                      <span className="truncate">{option.text}</span>
                      <span className="text-muted-foreground">{option.votes || 0} votes</span>
                    </div>
                  ))}
                  {poll.poll_options.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{poll.poll_options.length - 3} more options
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {getTotalVotes(poll)} total votes
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(poll.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Poll Dialog */}
      <Dialog open={!!editingPoll} onOpenChange={() => setEditingPoll(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Poll</DialogTitle>
            <DialogDescription>
              Update your poll details and options
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter poll title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter poll description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Settings</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowMultiple"
                      checked={editForm.allowMultipleVotes}
                      onCheckedChange={(checked) => 
                        setEditForm(prev => ({ ...prev, allowMultipleVotes: checked as boolean }))
                      }
                    />
                    <Label htmlFor="allowMultiple" className="text-sm">Allow multiple votes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireLogin"
                      checked={editForm.requireLogin}
                      onCheckedChange={(checked) => 
                        setEditForm(prev => ({ ...prev, requireLogin: checked as boolean }))
                      }
                    />
                    <Label htmlFor="requireLogin" className="text-sm">Require login to vote</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Poll Options</Label>
              <div className="space-y-2 mt-2">
                {editForm.options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOptionText(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingPoll(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePoll} disabled={loading}>
              {loading ? 'Updating...' : 'Update Poll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
