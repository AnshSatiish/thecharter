import { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronLeft, ChevronRight, BookOpen, LayoutGrid, Images, Globe, GraduationCap } from 'lucide-react';
import { PhotoProject } from '../types';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, useScroll, useTransform } from 'motion/react';

interface FullGalleryPageProps {
  project: PhotoProject | null;
  open: boolean;
  viewMode: 'story' | 'grid' | 'gallery';
  onViewModeChange: (mode: 'story' | 'grid' | 'gallery') => void;
  onClose: () => void;
}

export function FullGalleryPage({ project, open, viewMode, onViewModeChange, onClose }: FullGalleryPageProps) {
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCaptionOverlay, setShowCaptionOverlay] = useState(false);
  
  // Scroll within the container
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Reset scroll position when opening
  useEffect(() => {
    if (open) {
      console.log('FullGalleryPage opened');
      window.scrollTo(0, 0);
      setShowScrollHint(true);
      setCurrentImageIndex(0);
      setShowCaptionOverlay(false);
    } else {
      console.log('FullGalleryPage closed');
    }
  }, [open]);

  // Reset caption overlay when image changes
  useEffect(() => {
    setShowCaptionOverlay(false);
  }, [currentImageIndex]);

  // Hide scroll hint after scrolling
  useEffect(() => {
    if (!open) return;

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape pressed in gallery');
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (viewMode === 'gallery') {
        if (e.key === 'ArrowLeft') {
          setCurrentImageIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex(prev => Math.min(photoEssay.length - 1, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose, viewMode]);

  // Generate photo essay content dynamically from project images
  const photoEssay = useMemo(() => {
    if (!project) return [];
    
    // Use imageDescriptions if available for detailed cultural descriptions
    if (project.imageDescriptions && project.imageDescriptions.length > 0) {
      return project.images.map((image, index) => ({
        image: image,
        caption: project.imageDescriptions[index]?.description || `Photo ${index + 1}`,
        title: project.imageDescriptions[index]?.title || '',
        location: project.location.name,
        photographer: project.photographer,
        date: new Date(project.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));
    }
    
    // Use imageDetails if available, otherwise fall back to generic captions
    if (project.imageDetails && project.imageDetails.length > 0) {
      return project.imageDetails.map((detail, index) => ({
        image: detail.url,
        caption: detail.caption,
        location: detail.location || project.location.name,
        photographer: project.photographer,
        date: detail.date || new Date(project.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));
    }
    
    // Fallback: Create captions based on the project's description
    const getCaptionForImage = (index: number) => {
      const descriptionParts = project.description.split('. ');
      const baseCaption = descriptionParts[Math.min(index, descriptionParts.length - 1)];
      return baseCaption || `Documenting ${project.title.toLowerCase()} - a visual exploration.`;
    };
    
    return project.images.map((image, index) => ({
      image: image,
      caption: getCaptionForImage(index),
      location: project.location.name,
      photographer: project.photographer,
      date: new Date(project.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));
  }, [project]);

  if (!project || !open) return null;

  // Story Mode - Original scrolling parallax experience
  const renderStoryMode = () => (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#E64626] origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Header - Fixed */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/60 to-transparent pointer-events-none"
      >
        <div className="flex items-center justify-between p-6 md:p-8 pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="text-white">
              <div className="text-xs uppercase tracking-widest text-gray-400">
                Photo Essay
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-black/40 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('story')}
                className={`text-white hover:bg-white/10 ${viewMode === 'story' ? 'bg-white/20' : ''}`}
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`text-white hover:bg-white/10 ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('gallery')}
                className={`text-white hover:bg-white/10 ${viewMode === 'gallery' ? 'bg-white/20' : ''}`}
              >
                <Images className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Image with Parallax */}
        <motion.div
          className="absolute inset-0"
          style={{ y: parallaxY }}
        >
          <ImageWithFallback
            src={photoEssay[0].image}
            alt={project.title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
              {project.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed max-w-2xl mx-auto">
              {project.description}
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                <ImageWithFallback
                  src={project.photographerPhoto}
                  alt={project.photographer}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p>Photography by {project.photographer}</p>
                <p className="text-gray-400">
                  {new Date(project.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Hint */}
        {showScrollHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white z-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Project Introduction Section */}
      {project.longDescription && (
        <section className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={project.photographerPhoto}
                    alt={project.photographer}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Photography by</p>
                  <p className="font-medium text-lg">{project.photographer}</p>
                  <p className="text-sm text-gray-600">{project.photographerProfession} · {project.photographerUniversity}</p>
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {project.longDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-300">
                {project.keywords.map((keyword, i) => (
                  <span key={i} className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
                    {keyword}
                  </span>
                ))}
              </div>

            </motion.div>
          </div>
        </section>
      )}

      {/* Photo Essay Grid */}
      <div className="bg-black">
        {photoEssay.slice(1).map((item, index) => (
          <section
            key={index}
            className="relative"
          >
            {/* Full-screen Image */}
            <div className="w-full min-h-screen flex items-center justify-center bg-black py-12">
              <ImageWithFallback
                src={item.image}
                alt={`Photo ${index + 2}`}
                className="w-full h-auto max-h-screen object-contain"
              />
            </div>

            {/* Caption Below Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="bg-black text-white px-6 py-12 md:py-16"
            >
              <div className="max-w-3xl mx-auto">
                {item.title && (
                  <h3 className="text-2xl md:text-3xl text-[#C9A86A] mb-4">
                    {item.title}
                  </h3>
                )}
                <p className="text-lg md:text-xl leading-relaxed mb-6">
                  {item.caption}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm border-t border-gray-800 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-gray-300">{item.location}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-800" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-300">{item.date}</span>
                  </div>
                  <div className="ml-auto text-gray-600">
                    {index + 2} / {photoEssay.length}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        ))}

        {/* Conclusion Section */}
        <section className="relative bg-black text-white py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="h-px w-24 bg-gray-600 mb-8 mx-auto" />
              
              <h2 className="text-3xl md:text-4xl mb-8 text-center">
                {project.title}
              </h2>
              
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 text-center">
                {project.description}
              </p>

              <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-12 text-center">
                This photographic documentation by {project.photographer} offers a unique perspective 
                on {project.title.toLowerCase()}, captured in {project.location.name}.
              </p>

              {/* Photographer Bio */}
              <div className="border-t border-gray-800 pt-12 mt-12">
                <div className="flex items-start gap-6 justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 shrink-0">
                    <ImageWithFallback
                      src={project.photographerPhoto}
                      alt={project.photographer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="max-w-md">
                    <p className="text-lg mb-2">{project.photographer}</p>
                    <p className="text-sm text-gray-400 mb-3">
                      {project.photographerProfession} · {project.photographerUniversity}
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      A dedicated {project.photographerProfession.toLowerCase()} and photographer from {project.photographerUniversity}, 
                      bringing important stories to light through powerful visual narratives.
                    </p>
                    
                    {/* Academic and Personal Links */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.photographerWebsite && (
                        <a
                          href={project.photographerWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#E64626] hover:bg-[#F68B1F] text-white transition-colors shadow-sm"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      {project.photographerGoogleScholar && (
                        <a
                          href={project.photographerGoogleScholar}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-gray-700 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          Google Scholar
                        </a>
                      )}
                      {project.photographerResearchGate && (
                        <a
                          href={project.photographerResearchGate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-gray-700 transition-colors"
                        >
                          <GraduationCap className="w-3 h-3" />
                          ResearchGate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Publications Section */}
              {project.academicPublications && project.academicPublications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mt-16 max-w-3xl mx-auto px-6"
                >
                  <h3 className="text-xl text-white mb-4">Related Publications</h3>
                  <div className="space-y-2">
                    {project.academicPublications.map((pub, index) => {
                      const isMainAuthor = index < 2;
                      const authorName = pub.author || project.photographer;
                      return (
                        <div key={index} className="bg-white/5 backdrop-blur-sm p-3 rounded border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${
                                isMainAuthor 
                                  ? 'text-blue-300 bg-blue-500/20' 
                                  : 'text-gray-400 bg-white/10'
                              }`}>
                                {pub.type === 'thesis' ? 'Thesis' : pub.type === 'newspaper' ? 'News' : 'Journal'}
                              </span>
                              <span className="text-[10px] text-gray-400">·</span>
                              <span className="text-[10px] text-gray-300">{authorName}</span>
                            </div>
                            <span className="text-[10px] text-gray-500">{pub.year}</span>
                          </div>
                          <h4 className="text-sm text-white leading-snug mb-1">{pub.title}</h4>
                          {pub.journal && (
                            <p className="text-xs text-gray-400 italic mb-1">{pub.journal}</p>
                          )}
                          {pub.newspaper && (
                            <p className="text-xs text-gray-400 italic mb-1">{pub.newspaper}</p>
                          )}
                          {pub.abstract && (
                            <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                              {pub.abstract}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* End Mark */}
              <div className="mt-16 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-12 bg-gray-700" />
                  <span className="text-xs uppercase tracking-widest text-gray-500">End</span>
                  <div className="h-px w-12 bg-gray-700" />
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-12 text-center">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="bg-transparent border-gray-700 text-white hover:bg-white/10"
                >
                  Return to Projects
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );

  // Grid Mode - Grid layout with information cards
  const renderGridMode = () => (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              Photo Essay
            </p>
            <h1 className="text-2xl">{project.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('story')}
                className={`hover:bg-gray-200 ${viewMode === 'story' ? 'bg-white shadow-sm' : ''}`}
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`hover:bg-gray-200 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('gallery')}
                className={`hover:bg-gray-200 ${viewMode === 'gallery' ? 'bg-white shadow-sm' : ''}`}
              >
                <Images className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photoEssay.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <ImageWithFallback
                  src={item.image}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm">{item.location}</p>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4 text-[#c6a052]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4 text-[#c6a052]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {item.caption}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                    <ImageWithFallback
                      src={project.photographerPhoto}
                      alt={item.photographer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c6a052]">{item.photographer}</p>
                  </div>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Gallery Mode - Slideshow with thumbnails
  const renderGalleryMode = () => {
    const currentItem = photoEssay[currentImageIndex];
    
    return (
      <div className="absolute inset-0 bg-[#2a2a2a]">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between p-4 md:p-6">
            <div className="text-white">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                {currentImageIndex + 1} / {photoEssay.length}
              </p>
              <h1 className="text-xl md:text-2xl">{project.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Switcher */}
              <div className="flex gap-1 bg-black/40 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('story')}
                  className={`text-white hover:bg-white/10 ${viewMode === 'story' ? 'bg-white/20' : ''}`}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className={`text-white hover:bg-white/10 ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('gallery')}
                  className={`text-white hover:bg-white/10 ${viewMode === 'gallery' ? 'bg-white/20' : ''}`}
                >
                  <Images className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10 shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="absolute inset-0 flex items-center justify-center pt-20 pb-48">
          <div className="relative w-full h-full max-w-6xl mx-auto px-4">
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentImageIndex(prev => Math.min(photoEssay.length - 1, prev + 1))}
              disabled={currentImageIndex === photoEssay.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Image with border frame */}
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full border-8 border-[#c6a052] bg-black"
            >
              <ImageWithFallback
                src={currentItem.image}
                alt={`Photo ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {/* Caption Overlay - Shows on click */}
              {showCaptionOverlay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/80 flex items-end p-8 cursor-pointer"
                  onClick={() => setShowCaptionOverlay(false)}
                >
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                        <ImageWithFallback
                          src={project.photographerPhoto}
                          alt={currentItem.photographer}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-base text-[#c6a052]">{currentItem.photographer}</p>
                        <p className="text-sm text-gray-400">
                          {currentItem.location} • {currentItem.date}
                        </p>
                      </div>
                    </div>
                    {currentItem.title && (
                      <h3 className="text-xl md:text-2xl text-[#C9A86A] mb-3">
                        {currentItem.title}
                      </h3>
                    )}
                    <p className="text-base md:text-lg text-white leading-relaxed">
                      {currentItem.caption}
                    </p>
                    <p className="text-xs text-gray-500 mt-4">Click to close</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Info Panel & Thumbnails */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800">
          {/* Info Section */}
          <div 
            className="px-6 py-4 border-b border-gray-800 cursor-pointer hover:bg-[#252525] transition-colors"
            onClick={() => setShowCaptionOverlay(true)}
          >
            <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                    <ImageWithFallback
                      src={project.photographerPhoto}
                      alt={currentItem.photographer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-[#c6a052]">{currentItem.photographer}</p>
                    <p className="text-xs text-gray-500">
                      {currentItem.location} • {currentItem.date}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                  {currentItem.caption}
                </p>
                <p className="text-xs text-gray-500 mt-2 italic">Click to view full caption</p>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="px-6 py-4 overflow-x-auto">
            <div className="flex gap-2 max-w-6xl mx-auto">
              {photoEssay.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative shrink-0 w-20 h-16 rounded overflow-hidden transition-all ${
                    currentImageIndex === index
                      ? 'ring-2 ring-[#c6a052] ring-offset-2 ring-offset-[#1a1a1a]'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {currentImageIndex === index && (
                    <div className="absolute inset-0 border-2 border-[#c6a052]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {viewMode === 'story' && renderStoryMode()}
      {viewMode === 'grid' && renderGridMode()}
      {viewMode === 'gallery' && renderGalleryMode()}
    </div>
  );
}