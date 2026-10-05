import { X, Calendar, MapPin, ExternalLink, Tag, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoProject } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface ProjectDetailProps {
  project: PhotoProject | null;
  open: boolean;
  onClose: () => void;
  onViewGallery?: () => void;
}

export function ProjectDetail({ project, open, onClose, onViewGallery }: ProjectDetailProps) {
  if (!project) return null;

  const categoryColors = {
    wildlife: 'bg-[#64A70B]/15 text-[#64A70B] border-[#64A70B]/30',
    anthropology: 'bg-[#C9A86A]/20 text-[#8C8279] border-[#C9A86A]/40',
    urban: 'bg-[#424242]/10 text-[#424242] border-[#424242]/20',
    'border-interactions': 'bg-[#F68B1F]/15 text-[#F68B1F] border-[#F68B1F]/30',
    news: 'bg-[#E64626]/15 text-[#E64626] border-[#E64626]/30',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={categoryColors[project.category]} variant="secondary">
                {project.category}
              </Badge>
              <DialogTitle className="mt-2">{project.title}</DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <ImageWithFallback
                    src={project.photographerPhoto}
                    alt={project.photographer}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span>by {project.photographer} • {project.photographerProfession}</span>
                  <span className="text-xs">{project.photographerUniversity}</span>
                </div>
              </DialogDescription>
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
          {/* Main Image */}
          <div className="w-full overflow-hidden rounded-lg bg-gray-100">
            <ImageWithFallback
              src={project.images[0]}
              alt={project.title}
              className="w-full h-auto max-h-[600px] object-contain mx-auto"
            />
          </div>

          {/* Project Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>{project.location.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(project.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2">About this project</h3>
            <p className="text-gray-600">{project.description}</p>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <h4>Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.keywords.map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* View Project Button - Only for Arctic Wolves project */}
          {project.id === '6' && (
            <div className="bg-[#f5f1e8] rounded-lg p-6 text-center border-2 border-[#c6a052]">
              <p className="text-gray-700 mb-4">
                Experience the complete photo essay with 10 curated images
              </p>
              <Button
                className="bg-[#c6a052] hover:bg-[#b8934a]"
                size="lg"
                onClick={() => {
                  console.log('View Project clicked');
                  if (onViewGallery) {
                    onViewGallery();
                  }
                }}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Project
              </Button>
            </div>
          )}

          {/* Photographer Info */}
          <div className="border-t pt-4">
            <h4 className="mb-2">About the photographer</h4>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <ImageWithFallback
                    src={project.photographerPhoto}
                    alt={project.photographer}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p>{project.photographer}</p>
                  <p className="text-sm text-gray-500">{project.photographerProfession}</p>
                  <p className="text-sm text-gray-400">{project.photographerUniversity}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  window.open(project.photographerWebsite, '_blank');
                  toast.success('Opening photographer\'s website', {
                    description: `Visiting ${project.photographer}'s portfolio`
                  });
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Interested in similar projects or want to collaborate?
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                variant="outline"
                onClick={() => {
                  onClose();
                  toast.info('Filter applied', {
                    description: `Showing similar ${project.category} projects`
                  });
                  // This would trigger a filter by category in the parent component
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                View Similar
              </Button>
              <Button
                onClick={() => {
                  // Create mailto link to photographer
                  const subject = encodeURIComponent(`Inquiry about: ${project.title}`);
                  const body = encodeURIComponent(`Hi ${project.photographer},\n\nI came across your project "${project.title}" on The Charter and would love to discuss it further.\n\nBest regards`);
                  window.location.href = `mailto:contact@example.com?subject=${subject}&body=${body}`;
                  toast.success('Opening email client', {
                    description: `Drafting message to ${project.photographer}`
                  });
                }}
              >
                Contact Photographer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}