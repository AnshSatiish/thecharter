import { MessageSquare, Calendar, User } from 'lucide-react';
import { ForumPost } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ForumPostCardProps {
  post: ForumPost;
  onViewThread: (post: ForumPost) => void;
}

export function ForumPostCard({ post, onViewThread }: ForumPostCardProps) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={categoryColors[post.category]} variant="secondary">
                {post.category.replace('-', ' ')}
              </Badge>
              <Badge className={roleColors[post.authorRole]} variant="secondary">
                {post.authorRole}
              </Badge>
            </div>
            <h3 className="mb-2">{post.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{post.replies} replies</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewThread(post)}
          >
            View Thread
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
