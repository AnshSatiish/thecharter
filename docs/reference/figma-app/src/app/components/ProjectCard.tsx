import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { PhotoProject } from '../types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProjectCardProps {
  project: PhotoProject;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const categoryColors = {
    wildlife: 'bg-[#64A70B]/15 text-[#64A70B] border-[#64A70B]/30',
    anthropology: 'bg-[#C9A86A]/20 text-[#8C8279] border-[#C9A86A]/40',
    urban: 'bg-[#424242]/10 text-[#424242] border-[#424242]/20',
    'border-interactions': 'bg-[#F68B1F]/15 text-[#F68B1F] border-[#F68B1F]/30',
    news: 'bg-[#E64626]/15 text-[#E64626] border-[#E64626]/30',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group bg-white border-[#E8E5DC]">
      <div onClick={onClick}>
        <CardHeader className="p-0">
          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
            <ImageWithFallback
              src={project.images[0]}
              alt={project.title}
              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Badge className={categoryColors[project.category]} variant="secondary">
            {project.category}
          </Badge>
          <h3 className="mt-2 mb-1 break-words text-[#424242]" style={{ fontFamily: 'Georgia, serif' }}>{project.title}</h3>
          <p className="text-sm text-[#424242]/75 mb-3 line-clamp-2">
            {project.description}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-[#8C8279]">
              <MapPin className="w-4 h-4 text-[#E64626]" />
              <span>{project.location.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#8C8279]">
              <Calendar className="w-4 h-4 text-[#E64626]" />
              <span>{new Date(project.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {project.keywords.slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs border-[#C9A86A]/30 text-[#8C8279]">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F5F2E8] shrink-0">
            <ImageWithFallback
              src={project.photographerPhoto}
              alt={project.photographer}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm truncate text-[#424242]">by {project.photographer}</p>
            <p className="text-xs text-[#8C8279] truncate">{project.photographerProfession}</p>
            <p className="text-xs text-[#8C8279]/80 truncate">{project.photographerUniversity}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            window.open(project.photographerWebsite, '_blank');
          }}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}