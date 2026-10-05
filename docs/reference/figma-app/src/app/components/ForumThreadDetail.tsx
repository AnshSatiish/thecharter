import { useState } from 'react';
import { X, MessageSquare, ThumbsUp, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { ForumPost } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ForumThreadDetailProps {
  post: ForumPost | null;
  open: boolean;
  onClose: () => void;
}

interface Reply {
  id: string;
  author: string;
  authorRole: 'photographer' | 'researcher' | 'student';
  content: string;
  date: string;
  likes: number;
}

export function ForumThreadDetail({ post, open, onClose }: ForumThreadDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  if (!post) return null;

  // Mock replies - in a real app these would come from the backend
  const mockReplies: Reply[] = [
    {
      id: '1',
      author: 'Alex Rivera',
      authorRole: 'photographer',
      content: 'I\'ve had great success with the Canon RF 100-500mm. It\'s a bit above your budget new, but you can find good used deals around $2000.',
      date: '2024-11-03',
      likes: 8,
    },
    {
      id: '2',
      author: 'Emma Thompson',
      authorRole: 'photographer',
      content: 'Another option to consider is the Sigma 150-600mm Contemporary. Great value for the price and excellent image quality.',
      date: '2024-11-03',
      likes: 5,
    },
  ];

  const categoryColors = {
    politics: 'bg-red-100 text-red-800',
    climate: 'bg-green-100 text-green-800',
    culture: 'bg-purple-100 text-purple-800',
    'project-inquiry': 'bg-blue-100 text-blue-800',
    mentorship: 'bg-orange-100 text-orange-800',
    general: 'bg-gray-100 text-gray-800',
  };

  const roleColors = {
    photographer: 'bg-orange-100 text-orange-800',
    researcher: 'bg-cyan-100 text-cyan-800',
    student: 'bg-pink-100 text-pink-800',
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      // In a real app, this would submit to backend
      console.log('Submitting reply:', replyText);
      toast.success('Reply posted!', {
        description: 'Your reply has been added to the thread.'
      });
      setReplyText('');
      setShowReplyForm(false);
    } else {
      toast.error('Reply cannot be empty', {
        description: 'Please write something before posting.'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={categoryColors[post.category]} variant="secondary">
                  {post.category.replace('-', ' ')}
                </Badge>
                <Badge className={roleColors[post.authorRole]} variant="secondary">
                  {post.authorRole}
                </Badge>
              </div>
              <DialogTitle>{post.title}</DialogTitle>
              <DialogDescription>{post.content}</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Original Post */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>
                  {post.author.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p>{post.author}</p>
                  <span className="text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-gray-600">{post.content}</p>
                <div className="flex items-center gap-4 mt-4">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Helpful
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h3>{post.replies} Replies</h3>
            </div>

            {mockReplies.map((reply) => (
              <div key={reply.id} className="border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {reply.author.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p>{reply.author}</p>
                      <Badge className={roleColors[reply.authorRole]} variant="secondary" className="text-xs">
                        {reply.authorRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(reply.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">{reply.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {reply.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h4 className="mb-3">Post a Reply</h4>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Share your thoughts, advice, or insights..."
                rows={4}
                className="mb-3"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitReply}>
                  Post Reply
                </Button>
              </div>
            </div>
          )}

          {/* Reply CTA when form is hidden */}
          {!showReplyForm && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowReplyForm(true)}
            >
              <Reply className="w-4 h-4 mr-2" />
              Add Your Reply
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}