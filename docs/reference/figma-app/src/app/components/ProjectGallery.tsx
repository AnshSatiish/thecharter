import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Grid3x3 } from 'lucide-react';
import { PhotoProject } from '../types';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectGalleryProps {
  project: PhotoProject | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectGallery({ project, open, onClose }: ProjectGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'story' | 'lightbox'>('story');

  // Manage body scroll
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode === 'lightbox') {
          setViewMode('story');
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedImageIndex, viewMode]);

  if (!project || !open) return null;

  const displayImages = project.images.slice(0, 3);

  const goToNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const goToPreviousImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const getPhotoNarrative = (index: number): { title: string; text: string } => {
    const narratives = [
      {
        title: "Opening Scene",
        text: project.description
      },
      {
        title: "The Journey",
        text: `In ${project.location.name}, ${project.photographer} spent months documenting these moments, building trust with the community and capturing authentic stories that reveal the human dimension of ${project.category === 'wildlife' ? 'conservation' : project.category === 'urban' ? 'urban life' : project.category === 'anthropology' ? 'cultural traditions' : project.category === 'border-interactions' ? 'border communities' : 'current events'}. Each photograph represents hours of patient observation and deep engagement with the subject.`
      },
      {
        title: "The Context",
        text: `This work emerged from ${project.photographer}'s background as a ${project.photographerProfession.toLowerCase()} at ${project.photographerUniversity}, combining rigorous research methodology with visual storytelling. The project challenges viewers to look beyond headlines and see the complex realities facing communities in ${project.location.name}.`
      }
    ];
    return narratives[index] || narratives[0];
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {/* Story View Mode */}
      {viewMode === 'story' && (
        <div className="w-full h-full overflow-y-auto gallery-scrollbar">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-white/10 z-50"
          >
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl text-white mb-1">{project.title}</h1>
                  <p className="text-sm md:text-base text-gray-400">
                    By {project.photographer} · {new Date(project.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('lightbox')}
                    className="text-white hover:bg-white/10"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photo Story */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
            {displayImages.map((image, index) => {
              const narrative = getPhotoNarrative(index);
              return (
                <motion.section
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="mb-16 md:mb-24"
                >
                  {/* Image */}
                  <div 
                    className="relative group cursor-pointer mb-6 md:mb-8"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setViewMode('lightbox');
                    }}
                  >
                    <div className="relative overflow-hidden rounded-lg">
                      <ImageWithFallback
                        src={image}
                        alt={`${project.title} - Photo ${index + 1}`}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4">
                            <ZoomIn className="w-6 h-6 text-black" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Counter */}
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {index + 1} / {displayImages.length}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="max-w-3xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-xl md:text-2xl text-white mb-3">{narrative.title}</h3>
                      <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
                        {narrative.text}
                      </p>
                      <p className="text-sm text-gray-500 italic">
                        {project.location.name}, {new Date(project.date).getFullYear()}
                      </p>
                    </motion.div>
                  </div>

                  {/* Divider */}
                  {index < displayImages.length - 1 && (
                    <div className="mt-12 md:mt-16 flex items-center justify-center">
                      <div className="w-24 h-px bg-white/20"></div>
                    </div>
                  )}
                </motion.section>
              );
            })}

            {/* Credits */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-20 pt-12 border-t border-white/10"
            >
              <div className="max-w-3xl mx-auto">
                <h3 className="text-xl text-white mb-6">About This Project</h3>
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 shrink-0">
                    <ImageWithFallback
                      src={project.photographerPhoto}
                      alt={project.photographer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-white mb-1">{project.photographer}</p>
                    <p className="text-sm text-gray-400 mb-3">
                      {project.photographerProfession} · {project.photographerUniversity}
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {project.photographer} is a visual journalist documenting {project.category === 'wildlife' ? 'environmental conservation' : project.category === 'urban' ? 'urban communities' : project.category === 'anthropology' ? 'cultural traditions' : project.category === 'border-interactions' ? 'cross-border dynamics' : 'social movements'} through photography.
                    </p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.keywords.map((keyword) => (
                    <span 
                      key={keyword}
                      className="px-3 py-1.5 bg-white/10 text-gray-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="text-center pt-8 border-t border-white/10">
                  <p className="text-sm text-gray-500">— End of Photo Essay —</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Lightbox View Mode */}
      {viewMode === 'lightbox' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full bg-black"
          >
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center justify-between p-6">
                <div className="text-white">
                  <p className="text-lg">{project.title}</p>
                  <p className="text-sm text-gray-400">
                    {selectedImageIndex + 1} / {displayImages.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('story')}
                    className="text-white hover:bg-white/10"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative max-w-full max-h-full flex items-center justify-center"
                >
                  <ImageWithFallback
                    src={displayImages[selectedImageIndex]}
                    alt={`${project.title} - Photo ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousImage}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full z-40"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextImage}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full z-40"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>

            {/* Bottom Thumbnails */}
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-3 p-6">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === index 
                        ? 'ring-2 ring-white scale-110' 
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Caption */}
              <div className="px-6 pb-6 max-w-4xl mx-auto">
                <p className="text-white text-sm md:text-base text-center">
                  {getPhotoNarrative(selectedImageIndex).text.slice(0, 150)}...
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="absolute top-20 left-0 right-0 px-6">
              <div className="max-w-4xl mx-auto">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${((selectedImageIndex + 1) / displayImages.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
