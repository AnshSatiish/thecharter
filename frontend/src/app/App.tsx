import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from './components/ui/input';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { WorldMap } from './components/WorldMap';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetail } from './components/ProjectDetail';
import { FullGalleryPage } from './components/FullGalleryPage';
import { Community } from './components/Community';
import { ProjectsPage } from './components/ProjectsPage';
import { NewEntriesPage } from './components/NewEntriesPage';
import { Partners } from './components/Partners';
import { Events } from './components/Events';
import { WelcomeBanner } from './components/WelcomeBanner';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { Toaster } from './components/ui/sonner';
import { photoProjects } from './data/mockData';
import { PhotoProject, Category, SDG } from './types';

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('DIANA');
  
  // Navigation state
  const [currentSection, setCurrentSection] = useState<'map' | 'community' | 'projects' | 'newentries' | 'partners' | 'events' | 'profile'>('map');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [yearRange, setYearRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedSDG, setSelectedSDG] = useState<SDG[]>([]); // Changed from SDG | null to SDG[]
  
  // Project detail state
  const [selectedProject, setSelectedProject] = useState<PhotoProject | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Full gallery state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryViewMode, setGalleryViewMode] = useState<'story' | 'grid' | 'gallery'>('story');

  const handleNavigate = (section: 'map' | 'community' | 'projects' | 'newentries' | 'partners' | 'events' | 'profile') => {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Alt/Option + M for Map
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        handleNavigate('map');
      }
      
      // Alt/Option + C for Community
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        handleNavigate('community');
      }

      // Alt/Option + P for Projects
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        handleNavigate('projects');
      }

      // Alt/Option + N for New Entries
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNavigate('newentries');
      }

      // Alt/Option + E for Events
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        handleNavigate('events');
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (isDetailOpen) {
          handleCloseDetail();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDetailOpen]);

  // Extract all unique keywords from all projects
  const availableKeywords = useMemo(() => {
    const allKeywords = photoProjects.flatMap(project => project.keywords);
    return Array.from(new Set(allKeywords)).sort();
  }, []);

  // Filter projects based on all active filters
  const filteredProjects = useMemo(() => {
    return photoProjects.filter((project) => {
      // Category filter
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      
      // Year range filter
      const projectYear = new Date(project.date).getFullYear();
      const startYear = yearRange.start ? parseInt(yearRange.start) : null;
      const endYear = yearRange.end ? parseInt(yearRange.end) : null;
      
      let matchesYearRange = true;
      if (startYear && endYear) {
        matchesYearRange = projectYear >= startYear && projectYear <= endYear;
      } else if (startYear) {
        matchesYearRange = projectYear >= startYear;
      } else if (endYear) {
        matchesYearRange = projectYear <= endYear;
      }

      // Keywords filter - project must have ALL selected keywords
      const matchesKeywords = selectedKeywords.length === 0 || 
        selectedKeywords.every(keyword => project.keywords.includes(keyword));
      
      // SDG filter
      const matchesSDG = !selectedSDG.length || (project.sdgs && project.sdgs.some(sdg => selectedSDG.includes(sdg)));
      
      // Search filter (searches in title, description, keywords, location, and photographer)
      const matchesSearch = !searchQuery || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.photographer.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesYearRange && matchesKeywords && matchesSDG && matchesSearch;
    });
  }, [selectedCategory, yearRange, selectedKeywords, selectedSDG, searchQuery]);

  // Track search queries (after filteredProjects is defined)
  useEffect(() => {
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'true' && searchQuery) {
      const timer = setTimeout(() => {
        trackSearch(searchQuery, filteredProjects.length);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredProjects.length]);

  const handleYearRangeChange = (start: string, end: string) => {
    setYearRange({ start, end });
  };

  const handleProjectClick = (project: PhotoProject) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // Delay clearing the project to allow dialog animation to complete
    setTimeout(() => setSelectedProject(null), 300);
  };

  const handleViewGallery = () => {
    console.log('Opening gallery...');
    setGalleryViewMode('story'); // Always start in story mode
    setIsGalleryOpen(true);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Si no está autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2E8]">
      {/* Header */}
      <Header
        onSearchChange={setSearchQuery}
        onNavigate={handleNavigate}
        currentSection={currentSection}
        isAuthenticated={isAuthenticated}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      {currentSection === 'map' ? (
        <>
          {/* Filter Bar */}
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onYearRangeChange={(start, end) => setYearRange({ start, end })}
            yearRange={yearRange}
            selectedKeywords={selectedKeywords}
            onKeywordsChange={setSelectedKeywords}
            availableKeywords={availableKeywords}
            selectedSDG={selectedSDG}
            onSDGChange={setSelectedSDG}
          />

          {/* Disclaimer */}
          <div className="container mx-auto px-4 pt-4">
            <p className="text-xs text-gray-400 text-center">Projects displayed are for visual reference only</p>
          </div>

          {/* Map Section */}
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <WorldMap 
                projects={filteredProjects} 
                onProjectClick={handleProjectClick}
                onViewGallery={(project) => {
                  setSelectedProject(project);
                  handleViewGallery();
                }}
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
              <h2>Featured Projects</h2>
              <p className="text-gray-700">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
              </p>
            </div>
            
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search query to find more projects.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setYearRange({ start: '', end: '' });
                    setSelectedKeywords([]);
                    setSelectedSDG([]);
                  }}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </>
      ) : currentSection === 'projects' ? (
        <>
          {/* Projects Page */}
          <ProjectsPage 
            projects={filteredProjects}
            onProjectClick={handleProjectClick}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onYearRangeChange={handleYearRangeChange}
            yearRange={yearRange}
            selectedKeywords={selectedKeywords}
            onKeywordsChange={setSelectedKeywords}
            availableKeywords={availableKeywords}
            selectedSDG={selectedSDG}
            onSDGChange={setSelectedSDG}
          />
        </>
      ) : currentSection === 'newentries' ? (
        /* New Entries Section */
        <NewEntriesPage 
          onProjectClick={handleProjectClick}
          availableProject={photoProjects.find(p => p.id === '17')!}
        />
      ) : currentSection === 'partners' ? (
        /* Partners Section */
        <Partners />
      ) : currentSection === 'events' ? (
        /* Events Section */
        <Events />
      ) : currentSection === 'profile' ? (
        /* Profile Section */
        <ProfilePage onLogout={handleLogout} />
      ) : (
        /* Community Section */
        <Community />
      )}

      {/* Project Detail Modal - Only render when gallery is not open */}
      {!isGalleryOpen && (
        <ProjectDetail
          project={selectedProject}
          open={isDetailOpen}
          onClose={handleCloseDetail}
          onViewGallery={handleViewGallery}
        />
      )}

      {/* Full Gallery Page */}
      <FullGalleryPage
        project={selectedProject}
        open={isGalleryOpen}
        viewMode={galleryViewMode}
        onViewModeChange={setGalleryViewMode}
        onClose={() => {
          console.log('Closing gallery...');
          setIsGalleryOpen(false);
          // Reopen the detail modal after closing gallery
          setTimeout(() => {
            if (selectedProject) {
              setIsDetailOpen(true);
            }
          }, 100);
        }}
      />

      {/* Footer */}
      <Footer />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}