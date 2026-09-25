import { PhotoProject, Category, SDG } from '../types';
import { ProjectCard } from './ProjectCard';
import { ProjectsFilterSidebar } from './ProjectsFilterSidebar';

interface ProjectsPageProps {
  projects: PhotoProject[];
  onProjectClick: (project: PhotoProject) => void;
  selectedCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  onYearRangeChange: (startYear: string, endYear: string) => void;
  yearRange: { start: string; end: string };
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  availableKeywords: string[];
  selectedSDG: SDG | null;
  onSDGChange: (sdg: SDG | null) => void;
}

export function ProjectsPage({ 
  projects, 
  onProjectClick,
  selectedCategory,
  onCategoryChange,
  onYearRangeChange,
  yearRange,
  selectedKeywords,
  onKeywordsChange,
  availableKeywords,
  selectedSDG,
  onSDGChange
}: ProjectsPageProps) {
  return (
    <div className="min-h-screen bg-[#F5F2E8] flex">
      {/* Filter Sidebar */}
      <ProjectsFilterSidebar
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        onYearRangeChange={onYearRangeChange}
        yearRange={yearRange}
        selectedKeywords={selectedKeywords}
        onKeywordsChange={onKeywordsChange}
        availableKeywords={availableKeywords}
        selectedSDG={selectedSDG}
        onSDGChange={onSDGChange}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-[#424242] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              All Projects
            </h1>
            <p className="text-[#424242] max-w-3xl mx-auto">
              Explore our complete collection of photojournalism projects from recent graduates 
              around the world. Each project tells a unique story through visual narrative, 
              academic research, and field documentation.
            </p>
          </div>

          {/* Project Count */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#E64626] animate-pulse"></div>
              <p className="text-[#424242]">
                Showing <span className="font-semibold">{projects.length}</span> {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
          </div>

          {/* Projects Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onProjectClick(project)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <h3 className="mb-3">No projects found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters to find more projects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
