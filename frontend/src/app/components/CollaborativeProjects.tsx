import { useState } from 'react';
import { MapPin, Users, Calendar, BookOpen, Search, Plus, Clock, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface CollaborativeProject {
  id: string;
  title: string;
  category: 'students' | 'professional' | 'media';
  leader: {
    name: string;
    profession: string;
    university: string;
    photo: string;
  };
  description: string;
  territories: string[];
  rolesNeeded: {
    role: string;
    description: string;
    filled: boolean;
  }[];
  status: 'recruiting' | 'in-progress' | 'completed';
  startDate: string;
  keywords: string[];
  coverImage: string;
  mediaType?: 'Podcast' | 'YouTube Channel' | 'TV Interview' | 'Newspaper Article' | 'Documentary' | 'Radio Program';
  deadline?: string;
  timezone?: string;
}

const collaborativeProjects: CollaborativeProject[] = [
  // PROFESSIONAL PROJECTS
  {
    id: '1',
    title: 'Sacred Spaces and Environmental Justice in the Amazon Basin',
    category: 'professional',
    leader: {
      name: 'Dr. Ricardo Mendoza',
      profession: 'International Relations Professor',
      university: 'University of São Paulo',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Comprehensive research project examining the intersection of indigenous territorial rights, environmental degradation, and international law across the Amazon Basin. We seek to document sacred indigenous spaces, analyze environmental damage, build legal frameworks for protection, and bring international attention to this critical issue.',
    territories: ['Brazil', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia', 'Guyana', 'Suriname', 'French Guiana'],
    rolesNeeded: [
      {
        role: 'Anthropologist',
        description: 'Specialist in indigenous cultures to research how communities conceptualize sacred spaces and territorial connections',
        filled: false
      },
      {
        role: 'Geographer',
        description: 'Expert in physical geography and environmental science to study territorial changes and environmental damage patterns',
        filled: false
      },
      {
        role: 'Environmental Lawyer',
        description: 'Legal expert to develop case representation and international legal frameworks for indigenous territorial protection',
        filled: false
      },
      {
        role: 'Photojournalist',
        description: 'Visual storyteller to document the project and provide media coverage to international outlets',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'March 2025',
    keywords: ['Indigenous Rights', 'Environmental Justice', 'Amazon', 'International Law', 'Sacred Territories'],
    coverImage: 'https://images.unsplash.com/photo-1761998849593-e954aa29e1c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWF6b24lMjByYWluZm9yZXN0JTIwaW5kaWdlbm91c3xlbnwxfHx8fDE3NjMyNjkyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '2',
    title: 'Pacific Climate Migration: Legal and Social Frameworks',
    category: 'professional',
    leader: {
      name: 'Prof. Malia Kealoha',
      profession: 'Climate Migration Specialist',
      university: 'University of Hawaii',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNpZmljJTIwaXNsYW5kZXIlMjB3b21hbnxlbnwxfHx8fDE3NjMyNjkyNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Urgent interdisciplinary study documenting climate-induced displacement in Pacific island nations. This project aims to create comprehensive legal frameworks for climate refugees, document cultural heritage at risk, and develop sustainable resettlement strategies while preserving Pacific Islander identities and rights.',
    territories: ['Tuvalu', 'Kiribati', 'Marshall Islands', 'Fiji', 'Solomon Islands', 'Vanuatu', 'Samoa'],
    rolesNeeded: [
      {
        role: 'Cultural Anthropologist',
        description: 'Researcher to document threatened cultural practices, oral histories, and traditional knowledge systems before displacement',
        filled: false
      },
      {
        role: 'International Human Rights Lawyer',
        description: 'Legal specialist to develop "climate refugee" status frameworks and advocate for Pacific Islander rights in international courts',
        filled: false
      },
      {
        role: 'Marine Biologist',
        description: 'Scientist to assess coral reef degradation and sea-level impacts on traditional fishing grounds and food security',
        filled: false
      },
      {
        role: 'Documentary Filmmaker',
        description: 'Visual storyteller to create comprehensive documentary series for international awareness and policy advocacy',
        filled: false
      },
      {
        role: 'Urban Planner',
        description: 'Specialist in climate-resilient design to plan culturally appropriate resettlement communities',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'February 2025',
    keywords: ['Climate Migration', 'Pacific Islands', 'Climate Justice', 'Human Rights Law', 'Cultural Preservation'],
    coverImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNpZmljJTIwaXNsYW5kc3xlbnwxfHx8fDE3NjMyNjkyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '3',
    title: 'Urban Informality and Housing Rights in Sub-Saharan Africa',
    category: 'professional',
    leader: {
      name: 'Dr. Amara Okonkwo',
      profession: 'Urban Sociology Professor',
      university: 'University of Lagos',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwcm9mZXNzb3J8ZW58MXx8fHwxNzYzMjY5MjM3fDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Multi-city comparative study examining informal settlements, housing rights, and urban development policies across major Sub-Saharan African cities. Project aims to document lived experiences, challenge forced evictions through legal advocacy, map informal settlement patterns, and develop policy recommendations for equitable urban development.',
    territories: ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Tanzania', 'Uganda', 'Senegal'],
    rolesNeeded: [
      {
        role: 'Human Rights Lawyer',
        description: 'Legal advocate to challenge forced evictions and develop housing rights frameworks under African Charter on Human Rights',
        filled: false
      },
      {
        role: 'Urban Geographer',
        description: 'Mapping specialist to document informal settlement patterns, growth trajectories, and spatial inequalities',
        filled: false
      },
      {
        role: 'Social Anthropologist',
        description: 'Ethnographer to conduct community interviews and document daily life, social networks, and resilience strategies',
        filled: false
      },
      {
        role: 'Photojournalist',
        description: 'Visual documentarian to create ethical, dignity-centered photo essays of informal settlement communities',
        filled: false
      },
      {
        role: 'Public Health Researcher',
        description: 'Specialist to assess water, sanitation, and health infrastructure gaps in informal settlements',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'April 2025',
    keywords: ['Urban Informality', 'Housing Rights', 'Africa', 'Social Justice', 'Urban Development'],
    coverImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2l0eSUyMHVyYmFufGVufDF8fHx8MTc2MzI2OTI0N3ww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '4',
    title: 'Post-Conflict Memory and Reconciliation in the Balkans',
    category: 'professional',
    leader: {
      name: 'Prof. Jelena Kovačević',
      profession: 'Transitional Justice Scholar',
      university: 'University of Belgrade',
      photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXJuJTIwZXVyb3BlYW4lMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Cross-border research initiative examining collective memory, trauma narratives, and reconciliation processes 30 years after the Yugoslav Wars. This project seeks to document survivor testimonies, analyze ongoing legal proceedings, study memorial landscapes, and create educational materials for future generations.',
    territories: ['Serbia', 'Bosnia and Herzegovina', 'Croatia', 'Kosovo', 'North Macedonia', 'Slovenia'],
    rolesNeeded: [
      {
        role: 'Oral Historian',
        description: 'Specialist in trauma-informed interviewing to collect and archive survivor testimonies from all conflict sides',
        filled: false
      },
      {
        role: 'International Criminal Lawyer',
        description: 'Expert to analyze ongoing war crimes trials and develop transitional justice frameworks',
        filled: false
      },
      {
        role: 'Visual Anthropologist',
        description: 'Researcher to document memorial sites, commemorative practices, and contested historical narratives',
        filled: false
      },
      {
        role: 'Investigative Journalist',
        description: 'Reporter to uncover unreported stories and provide balanced regional media coverage',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'June 2025',
    keywords: ['Post-Conflict', 'Balkans', 'Transitional Justice', 'Memory Studies', 'Reconciliation'],
    coverImage: 'https://images.unsplash.com/photo-1695119967410-dcb519bf5cea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxrYW5zJTIwc2FyYWpldm8lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzYzNDA2NzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  
  // STUDENT PROJECTS - Interdisciplinary Case Project
  {
    id: '5',
    title: 'Gender-Based Violence in Latin American Universities',
    category: 'students',
    leader: {
      name: 'María Elena Torres',
      profession: 'Social Work Student',
      university: 'University of Sydney',
      photo: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzE3MzA1OHww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Final project for Interdisciplinary Case Project course examining gender-based violence prevention programs in Latin American universities. Seeking collaborators from different fields to create comprehensive intervention framework combining legal reform, psychological support, and campus policy development.',
    territories: ['Argentina', 'Chile', 'Colombia', 'Mexico', 'Brazil'],
    rolesNeeded: [
      {
        role: 'Law Student',
        description: 'To research legal frameworks and develop policy recommendations for university-level GBV prevention',
        filled: false
      },
      {
        role: 'Psychology Student',
        description: 'To design trauma-informed support protocols and analyze psychological impacts',
        filled: false
      },
      {
        role: 'Sociology Student',
        description: 'To conduct campus culture surveys and analyze institutional responses across universities',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'January 2025',
    keywords: ['Gender Violence', 'Campus Safety', 'Student Project', 'Latin America', 'Prevention'],
    coverImage: 'https://images.unsplash.com/photo-1758270705482-cee87ea98738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc2MzMxNDA5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '6',
    title: 'Urban Gentrification and Displacement in Global Cities',
    category: 'students',
    leader: {
      name: 'James Chen',
      profession: 'Urban Studies Student',
      university: 'University of Sydney',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbiUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjM0MDc5Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'Interdisciplinary Case Project comparing gentrification patterns in London, New York, and Sydney. Team project analyzing economic drivers, community displacement, and resistance movements. Looking for collaborators to complete comparative case study for final submission.',
    territories: ['United Kingdom', 'United States', 'Australia'],
    rolesNeeded: [
      {
        role: 'Economics Student',
        description: 'To analyze housing market data, rent increases, and economic displacement patterns',
        filled: false
      },
      {
        role: 'Anthropology Student',
        description: 'To document community narratives and cultural impacts of displacement',
        filled: false
      },
      {
        role: 'Geography Student',
        description: 'To create spatial analysis maps and identify gentrification hotspots',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'February 2025',
    keywords: ['Gentrification', 'Urban Development', 'Student Research', 'Housing Crisis', 'Community'],
    coverImage: 'https://images.unsplash.com/photo-1600868182766-6e60f677f637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW50cmlmaWNhdGlvbiUyMHVyYmFuJTIwZGV2ZWxvcG1lbnR8ZW58MXx8fHwxNzYzNDA3OTE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  
  // MEDIA PROJECTS - News Sections Seeking Experts
  {
    id: '7',
    title: 'URGENT: Nepal Political Crisis - Expert Commentary Needed',
    category: 'media',
    leader: {
      name: 'BBC World Service',
      profession: 'International News Division',
      university: 'BBC Broadcasting House',
      photo: 'https://images.unsplash.com/photo-1660675587271-47f1083bc367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2RjYXN0JTIwc3R1ZGlvJTIwaW50ZXJ2aWV3fGVufDF8fHx8MTc2MzQwNzkxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    description: 'Ongoing political unrest in Nepal requires immediate expert analysis for radio programs, podcasts, and digital features. Seeking South Asia specialists to provide historical context, political analysis, and ground-level perspectives on current demonstrations and governmental responses.',
    territories: ['Nepal', 'India', 'Tibet', 'Bhutan'],
    rolesNeeded: [
      {
        role: 'Nepal Political Scientist',
        description: 'Expert on Nepali politics, constitutional law, and democratic transitions for live interviews and analysis',
        filled: false
      },
      {
        role: 'South Asia Historian',
        description: 'Scholar to provide historical context on Nepal\'s political movements and regional dynamics',
        filled: false
      },
      {
        role: 'Human Rights Specialist',
        description: 'Expert on protest rights and state response to analyze current demonstrations',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'Immediate',
    keywords: ['Nepal', 'Political Crisis', 'Media Commentary', 'Expert Analysis', 'Breaking News'],
    coverImage: 'https://images.unsplash.com/photo-1758002467064-7754e0690600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMHN0cmVldCUyMHByb3Rlc3R8ZW58MXx8fHwxNzYzNDA3OTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    mediaType: 'Radio Program',
    deadline: 'November 20, 2025 - 14:00',
    timezone: 'GMT'
  },
  {
    id: '8',
    title: 'Middle East Podcast Series - Regional Experts Wanted',
    category: 'media',
    leader: {
      name: 'Al Jazeera English',
      profession: 'Documentary & Podcast Unit',
      university: 'Al Jazeera Media Network',
      photo: 'https://images.unsplash.com/photo-1660675587271-47f1083bc367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2RjYXN0JTIwc3R1ZGlvJTIwaW50ZXJyaWV3fGVufDF8fHx8MTc2MzQwNzkxMXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    description: 'New podcast series "Voices from the Middle East" seeks academic experts, activists, and cultural commentators for monthly interviews. Topics include regional politics, cultural shifts, youth movements, and social change across MENA region. Seeking diverse perspectives for balanced coverage.',
    territories: ['Lebanon', 'Jordan', 'Palestine', 'Syria', 'Iraq', 'Egypt', 'Yemen'],
    rolesNeeded: [
      {
        role: 'Middle East Political Analyst',
        description: 'Scholar specializing in regional politics and international relations for recurring commentary',
        filled: false
      },
      {
        role: 'Cultural Anthropologist',
        description: 'Expert on MENA youth culture, social movements, and generational change',
        filled: false
      },
      {
        role: 'Conflict Resolution Specialist',
        description: 'Scholar analyzing peace processes and regional diplomatic efforts',
        filled: false
      },
      {
        role: 'Gender Studies Scholar',
        description: 'Expert on women\'s rights movements and gender dynamics in MENA region',
        filled: false
      }
    ],
    status: 'recruiting',
    startDate: 'March 2025',
    keywords: ['Middle East', 'Podcast', 'Expert Commentary', 'Regional Analysis', 'Media'],
    coverImage: 'https://images.unsplash.com/photo-1684252152859-42f59c6542ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0JTIwY29uZmxpY3QlMjBkb2N1bWVudGFyeXxlbnwxfHx8fDE3NjM0MDc5MTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    mediaType: 'Podcast',
    deadline: 'December 15, 2025 - 18:00',
    timezone: 'AST (Arabia Standard Time)'
  }
];

export function CollaborativeProjects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'students' | 'professional' | 'media'>('all');

  const filteredProjects = collaborativeProjects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleApply = (projectTitle: string, role: string) => {
    toast.success(`Application submitted for ${role} position in "${projectTitle}"`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl text-white mb-3">Collaborative Research Projects</h2>
        <p className="text-white/80 max-w-3xl mx-auto">
          Join interdisciplinary teams working on cutting-edge social science research. Connect with specialists from different fields to create meaningful impact.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search projects by title, keywords, or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/90 border-none"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-6 py-2 rounded-full transition-colors shadow-md ${
            categoryFilter === 'all' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
          } text-white`}
        >
          All Projects
        </button>
        <button
          onClick={() => setCategoryFilter('students')}
          className={`px-6 py-2 rounded-full transition-colors shadow-md ${
            categoryFilter === 'students' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
          } text-white`}
        >
          Students
        </button>
        <button
          onClick={() => setCategoryFilter('professional')}
          className={`px-6 py-2 rounded-full transition-colors shadow-md ${
            categoryFilter === 'professional' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
          } text-white`}
        >
          Professional
        </button>
        <button
          onClick={() => setCategoryFilter('media')}
          className={`px-6 py-2 rounded-full transition-colors shadow-md ${
            categoryFilter === 'media' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
          } text-white`}
        >
          Media
        </button>
      </div>

      {/* Category Description */}
      {categoryFilter !== 'all' && (
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md">
          {categoryFilter === 'students' && (
            <div>
              <h3 className="text-[#E64626] mb-2">Interdisciplinary Case Project</h3>
              <p className="text-gray-700 text-sm">
                Final projects by students seeking collaborators from different fields to create comprehensive interdisciplinary research. 
                These projects fulfill course requirements while building real-world research skills and cross-disciplinary networks.
              </p>
            </div>
          )}
          {categoryFilter === 'professional' && (
            <div>
              <h3 className="text-[#E64626] mb-2">PhD & Scholar Research</h3>
              <p className="text-gray-700 text-sm">
                Experienced researchers, PhD candidates, and institutional scholars seeking specialists from all fields for collaborative research projects. 
                These initiatives combine diverse expertise to address complex social science questions and create lasting academic impact.
              </p>
            </div>
          )}
          {categoryFilter === 'media' && (
            <div>
              <h3 className="text-[#E64626] mb-2">Media Expert Requests</h3>
              <p className="text-gray-700 text-sm">
                News organizations, podcasts, and media outlets seeking academic experts for interviews, commentary, and analysis on current events. 
                Opportunities to share your expertise with global audiences and contribute to informed public discourse.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Projects Grid */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className={`overflow-hidden bg-white/95 backdrop-blur-sm ${project.category === 'media' ? 'mt-8' : ''}`}>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Project Image */}
              <div className="md:col-span-1">
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="w-full h-full object-cover min-h-[300px]"
                />
              </div>

              {/* Project Content */}
              <div className="md:col-span-2 p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl text-[#424242]">{project.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            project.category === 'students' ? 'border-[#C9A86A] text-[#C9A86A]' :
                            project.category === 'media' ? 'border-[#F68B1F] text-[#F68B1F]' :
                            'border-[#424242] text-[#424242]'
                          }`}
                        >
                          {project.category === 'students' ? 'Student Project' : 
                           project.category === 'media' ? 'Media Request' : 
                           'Professional'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={project.leader.photo}
                            alt={project.leader.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p>{project.leader.name}</p>
                            <p className="text-xs text-gray-500">{project.leader.profession}</p>
                          </div>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span>{project.leader.university}</span>
                      </div>
                    </div>
                    <Badge className="bg-[#E64626] text-white">
                      {project.status === 'recruiting' ? 'Recruiting' : project.status}
                    </Badge>
                  </div>

                  {/* Territories */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-[#F68B1F] mt-1 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {project.territories.map((territory, idx) => (
                        <span key={idx} className="text-sm text-gray-600">
                          {territory}{idx < project.territories.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#F68B1F]" />
                    <span className="text-sm text-gray-600">Expected Start: {project.startDate}</span>
                  </div>

                  {/* Media-specific info */}
                  {project.category === 'media' && (
                    <div className="space-y-2 mb-3">
                      {project.mediaType && (
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-[#E64626]" />
                          <span className="text-sm text-gray-600">Format: <span className="text-[#E64626]">{project.mediaType}</span></span>
                        </div>
                      )}
                      {project.deadline && project.timezone && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#E64626]" />
                          <span className="text-sm text-gray-600">Needed by: <span className="text-[#E64626]">{project.deadline} ({project.timezone})</span></span>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-0">
                  {/* Description */}
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {project.description}
                  </p>

                  {/* Roles Needed */}
                  <div className="mb-4">
                    <h4 className="flex items-center gap-2 mb-3 text-[#424242]">
                      <Users className="w-4 h-4 text-[#F68B1F]" />
                      <span>Positions Available ({project.rolesNeeded.filter(r => !r.filled).length})</span>
                    </h4>
                    <div className="grid gap-3">
                      {project.rolesNeeded.map((role, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            role.filled
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-[#F68B1F]/5 border-[#F68B1F]/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`${role.filled ? 'text-gray-500' : 'text-[#E64626]'}`}>
                                  {role.role}
                                </span>
                                {role.filled && (
                                  <Badge variant="outline" className="text-xs">Filled</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{role.description}</p>
                            </div>
                            {!role.filled && (
                              <Button
                                size="sm"
                                onClick={() => handleApply(project.title, role.role)}
                                className="bg-[#E64626] hover:bg-[#E64626]/90 text-white text-xs"
                              >
                                Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-2">
                    {project.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/70">No projects found matching your search.</p>
        </div>
      )}
    </div>
  );
}
