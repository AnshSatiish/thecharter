import { useState } from 'react';
import { MessageSquare, Users, Briefcase, Search, Plus, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { ForumPost } from '../types';
import { forumPosts } from '../data/mockData';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { ForumPostCard } from './ForumPostCard';
import { ForumThreadDetail } from './ForumThreadDetail';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { CollaborativeProjects } from './CollaborativeProjects';
import { JobBoard } from './JobBoard';

export function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumPost | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'forum' | 'members' | 'projects' | 'jobs'>('members');
  const [memberFilter, setMemberFilter] = useState<'all' | 'students' | 'faculty' | 'media' | 'field'>('all');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    location: [] as string[],
    field: [] as string[],
    scholar: [] as string[],
    university: [] as string[],
  });

  const handleViewThread = (post: ForumPost) => {
    setSelectedThread(post);
    setIsThreadOpen(true);
  };

  const filteredPosts = forumPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1643559247329-7254c71646f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHN1bnNldCUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3NjIzNDc0MDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      
      <div className="container mx-auto px-4 pt-4 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Tabs - Top Left */}
          <div className="mb-1 flex justify-start">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                  activeTab === 'projects' 
                    ? 'bg-[#E64626] text-white shadow-sm' 
                    : 'bg-white/70 hover:bg-white/90 text-[#424242]'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'projects' ? 'text-white' : 'text-[#F68B1F]'}`} />
                <span>Collaborative Projects</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                  activeTab === 'members' 
                    ? 'bg-[#E64626] text-white shadow-sm' 
                    : 'bg-white/70 hover:bg-white/90 text-[#424242]'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'members' ? 'text-white' : 'text-[#F68B1F]'}`} />
                <span>Members</span>
              </button>
              <button
                onClick={() => setActiveTab('forum')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                  activeTab === 'forum' 
                    ? 'bg-[#E64626] text-white shadow-sm' 
                    : 'bg-white/70 hover:bg-white/90 text-[#424242]'
                }`}
              >
                <MessageSquare className={`w-4 h-4 ${activeTab === 'forum' ? 'text-white' : 'text-[#F68B1F]'}`} />
                <span>Forum</span>
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                  activeTab === 'jobs' 
                    ? 'bg-[#E64626] text-white shadow-sm' 
                    : 'bg-white/70 hover:bg-white/90 text-[#424242]'
                }`}
              >
                <Briefcase className={`w-4 h-4 ${activeTab === 'jobs' ? 'text-white' : 'text-[#F68B1F]'}`} />
                <span>Job Board</span>
              </button>
            </div>
          </div>

          {/* Render Collaborative Projects, Job Board, or Community Content */}
          {activeTab === 'projects' ? (
            <CollaborativeProjects />
          ) : activeTab === 'jobs' ? (
            <>
              {/* Job Board Header */}
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-white text-4xl">
                  Career Opportunities for Social Sciences Professionals
                </h1>
                <p className="text-white/90 text-lg max-w-3xl mx-auto">
                  Explore positions in journalism, international analysis, cultural management, international organizations and more
                </p>
              </div>
              <JobBoard />
            </>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-white text-4xl">
                  {activeTab === 'members' 
                    ? 'Increase your network with researchers that align with your professional goals'
                    : 'Share experiences, ask questions, and learn from fellow photographers and researchers'
                  }
                </h1>
              </div>

              {/* Search Bar */}
              <div className="mb-8 max-w-3xl mx-auto">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder={activeTab === 'members' ? 'Find a member...' : 'Search forum Topics...'}
                  className="pl-12 py-6 text-lg bg-white/95 backdrop-blur-sm border-none shadow-lg rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
                <DialogTrigger asChild>
                  <button className="px-6 py-3 bg-[#E64626] text-white rounded-xl hover:bg-[#F68B1F] transition-colors shadow-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Advanced Search</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: 'Georgia, serif' }} className="text-2xl text-[#424242]">
                      Advanced Search
                    </DialogTitle>
                    <DialogDescription className="text-[#8C8279]">
                      Refine your search with additional filters
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Location/Region */}
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-[#424242]">Location/Region</Label>
                      <Select onValueChange={(value) => {
                        if (!advancedFilters.location.includes(value)) {
                          setAdvancedFilters({...advancedFilters, location: [...advancedFilters.location, value]});
                        }
                      }}>
                        <SelectTrigger id="location" className="border-[#E8E5DC]">
                          <SelectValue placeholder="Add location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia">Asia</SelectItem>
                          <SelectItem value="Americas">Americas</SelectItem>
                          <SelectItem value="Europe">Europe</SelectItem>
                          <SelectItem value="Africa">Africa</SelectItem>
                          <SelectItem value="Oceania">Oceania</SelectItem>
                          <SelectItem value="Pacific Islands">Pacific Islands</SelectItem>
                          <SelectItem value="Middle East">Middle East</SelectItem>
                        </SelectContent>
                      </Select>
                      {advancedFilters.location.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {advancedFilters.location.map((loc) => (
                            <div key={loc} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                              <span>{loc}</span>
                              <button
                                onClick={() => setAdvancedFilters({
                                  ...advancedFilters,
                                  location: advancedFilters.location.filter(l => l !== loc)
                                })}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Field */}
                    <div className="space-y-2">
                      <Label htmlFor="field" className="text-[#424242]">Field</Label>
                      <Select onValueChange={(value) => {
                        if (!advancedFilters.field.includes(value)) {
                          setAdvancedFilters({...advancedFilters, field: [...advancedFilters.field, value]});
                        }
                      }}>
                        <SelectTrigger id="field" className="border-[#E8E5DC]">
                          <SelectValue placeholder="Add field of study" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Anthropology">Anthropology</SelectItem>
                          <SelectItem value="Sociology">Sociology</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                          <SelectItem value="Marine Biology">Marine Biology</SelectItem>
                          <SelectItem value="International Relations">International Relations</SelectItem>
                          <SelectItem value="Cultural Studies">Cultural Studies</SelectItem>
                          <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                          <SelectItem value="Journalism">Journalism</SelectItem>
                          <SelectItem value="Photojournalism">Photojournalism</SelectItem>
                        </SelectContent>
                      </Select>
                      {advancedFilters.field.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {advancedFilters.field.map((f) => (
                            <div key={f} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                              <span>{f}</span>
                              <button
                                onClick={() => setAdvancedFilters({
                                  ...advancedFilters,
                                  field: advancedFilters.field.filter(field => field !== f)
                                })}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Researcher & Media */}
                    <div className="space-y-2">
                      <Label htmlFor="scholar" className="text-[#424242]">Researcher & Media</Label>
                      <Select onValueChange={(value) => {
                        if (!advancedFilters.scholar.includes(value)) {
                          setAdvancedFilters({...advancedFilters, scholar: [...advancedFilters.scholar, value]});
                        }
                      }}>
                        <SelectTrigger id="scholar" className="border-[#E8E5DC]">
                          <SelectValue placeholder="Add researcher or media type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="Graduate">Graduate</SelectItem>
                          <SelectItem value="Faculty">Faculty</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                          <SelectItem value="News">News</SelectItem>
                        </SelectContent>
                      </Select>
                      {advancedFilters.scholar.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {advancedFilters.scholar.map((s) => (
                            <div key={s} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                              <span>{s}</span>
                              <button
                                onClick={() => setAdvancedFilters({
                                  ...advancedFilters,
                                  scholar: advancedFilters.scholar.filter(scholar => scholar !== s)
                                })}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* University */}
                    <div className="space-y-2">
                      <Label htmlFor="university" className="text-[#424242]">University</Label>
                      <Select onValueChange={(value) => {
                        if (!advancedFilters.university.includes(value)) {
                          setAdvancedFilters({...advancedFilters, university: [...advancedFilters.university, value]});
                        }
                      }}>
                        <SelectTrigger id="university" className="border-[#E8E5DC]">
                          <SelectValue placeholder="Add university" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="University of Sydney">University of Sydney</SelectItem>
                          <SelectItem value="Melbourne University">Melbourne University</SelectItem>
                          <SelectItem value="ANU Canberra">ANU Canberra</SelectItem>
                          <SelectItem value="James Cook University">James Cook University</SelectItem>
                          <SelectItem value="University of Queensland">University of Queensland</SelectItem>
                          <SelectItem value="UNSW Sydney">UNSW Sydney</SelectItem>
                        </SelectContent>
                      </Select>
                      {advancedFilters.university.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {advancedFilters.university.map((u) => (
                            <div key={u} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                              <span>{u}</span>
                              <button
                                onClick={() => setAdvancedFilters({
                                  ...advancedFilters,
                                  university: advancedFilters.university.filter(uni => uni !== u)
                                })}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAdvancedFilters({ location: [], field: [], scholar: [], university: [] });
                      }}
                      className="border-[#E8E5DC]"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={() => {
                        toast.success('Advanced search filters applied');
                        setIsAdvancedSearchOpen(false);
                      }}
                      className="bg-[#E64626] hover:bg-[#F68B1F] text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-8 flex justify-center gap-3">
            {activeTab === 'members' ? (
              <>
                <button 
                  onClick={() => setMemberFilter('students')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    memberFilter === 'students' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Students
                </button>
                <button 
                  onClick={() => setMemberFilter('faculty')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    memberFilter === 'faculty' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Faculty
                </button>
                <button 
                  onClick={() => setMemberFilter('media')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    memberFilter === 'media' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Media
                </button>
                <button 
                  onClick={() => setMemberFilter('field')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    memberFilter === 'field' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Charters
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    selectedCategory === 'all' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedCategory('politics')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    selectedCategory === 'politics' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Politics
                </button>
                <button 
                  onClick={() => setSelectedCategory('climate')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    selectedCategory === 'climate' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Climate Change
                </button>
                <button 
                  onClick={() => setSelectedCategory('culture')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    selectedCategory === 'culture' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Culture
                </button>
                <button 
                  onClick={() => setSelectedCategory('photography')}
                  className={`px-6 py-2 rounded-full transition-colors shadow-md ${
                    selectedCategory === 'photography' ? 'bg-[#F68B1F]' : 'bg-[#E64626] hover:bg-[#F68B1F]'
                  } text-white`}
                >
                  Photography
                </button>
              </>
            )}
          </div>

          {activeTab === 'forum' ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.replies} Replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Members Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Mock member cards */}
              {[
                // Students
                { name: 'Sofia Martínez', profession: 'Anthropologist', role: 'Student', project: 'Voices of the Amazon', uni: 'University of Sydney', keywords: 'Indigenous Rights, Conservation, Ethnography', photo: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzE3MzA1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1761998849593-e954aa29e1c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWF6b24lMjByYWluZm9yZXN0JTIwaW5kaWdlbm91c3xlbnwxfHx8fDE3NjMyNjkyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Lucas da Silva', profession: 'Sociologist', role: 'Student', project: 'Favela Stories', uni: 'University of Sydney', keywords: 'Urban Life, Brazil, Social Issues', photo: 'https://images.unsplash.com/photo-1668068154949-9d6a5c8bf5be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjMyNjg5NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1718927100674-0f39261e61c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXZlbGElMjBicmF6aWwlMjB1cmJhbnxlbnwxfHx8fDE3NjMyNjkyMjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Amara Okonkwo', profession: 'Cultural Studies', role: 'Student', project: 'West African Textiles', uni: 'University of Sydney', keywords: 'African Culture, Fashion, Heritage', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBzdHVkZW50fGVufDF8fHx8MTc2MzI2OTIyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0JTIwYWZyaWNhJTIwdGV4dGlsZXN8ZW58MXx8fHwxNzYzMjY5MjI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Kai Nguyen', profession: 'Environmental Studies', role: 'Student', project: 'Mekong Delta Changes', uni: 'University of Melbourne', keywords: 'Climate Impact, Southeast Asia, Rivers', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbiUyMHN0dWRlbnR8ZW58MXx8fHwxNzYzMjY5MjI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1528127269322-539801943592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWtvbmclMjBkZWx0YSUyMHJpdmVyfGVufDF8fHx8MTc2MzI2OTIyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Isabella Rossi', profession: 'Political Science', role: 'Student', project: 'European Youth Politics', uni: 'University of Queensland', keywords: 'Democracy, Youth Movements, Europe', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwd29tYW4lMjBzdHVkZW50fGVufDF8fHx8MTc2MzI2OTIyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldXJvcGVhbiUyMHlvdXRoJTIwcHJvdGVzdHxlbnwxfHx8fDE3NjMyNjkyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Ahmed Al-Farsi', profession: 'Architecture Studies', role: 'Student', project: 'Riyadh Urban Transformation', uni: 'UNSW Sydney', keywords: 'Urban Design, Middle East, Modernization', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwbWFuJTIwc3R1ZGVudHxlbnwxfHx8fDE3NjMyNjkyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXlhZGglMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzYzMjY5MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Maya Patel', profession: 'Documentary Photography', role: 'Student', project: 'Mumbai Street Life', uni: 'ANU Canberra', keywords: 'Street Photography, India, Daily Life', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHN0dWRlbnR8ZW58MXx8fHwxNzYzMjY5MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdW1iYWklMjBzdHJlZXQlMjBsaWZlfGVufDF8fHx8MTc2MzI2OTIyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Johan Petersen', profession: 'Human Geography', role: 'Student', project: 'Nordic Sustainability', uni: 'University of Sydney', keywords: 'Sustainable Living, Scandinavia, Green Cities', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2FuZGluYXZpYW4lMjBtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjMyNjkyMjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3JkaWMlMjBjaXR5JTIwZ3JlZW58ZW58MXx8fHwxNzYzMjY5MjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Zara Khalil', profession: 'Conflict Studies', role: 'Student', project: 'Beirut Reconstruction', uni: 'University of Melbourne', keywords: 'Post-Conflict, Lebanon, Urban Recovery', photo: 'https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwd29tYW4lMjBzdHVkZW50fGVufDF8fHx8MTc2MzI2OTIyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlydXQlMjBjaXR5fGVufDF8fHx8MTc2MzI2OTIyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Takeshi Yamamoto', profession: 'Visual Anthropology', role: 'Student', project: 'Aging Japan', uni: 'University of Queensland', keywords: 'Demographic Change, Japan, Elderly Care', photo: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMG1hbiUyMHN0dWRlbnR8ZW58MXx8fHwxNzYzMjY5MjI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1694623473792-b91e1c70ef2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbiUyMGVsZGVybHklMjBjYXJlfGVufDF8fHx8MTc2MzI2OTIyOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Lena Kowalski', profession: 'Media Studies', role: 'Student', project: 'Polish Digital Natives', uni: 'UNSW Sydney', keywords: 'Social Media, Eastern Europe, Youth Culture', photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2xpc2glMjB3b21hbiUyMHN0dWRlbnR8ZW58MXx8fHwxNzYzMjY5MjI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMHlvdXRofGVufDF8fHx8MTc2MzI2OTIzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Gabriel Moreno', profession: 'Human Rights Law', role: 'Student', project: 'Immigration Rights Documentation', uni: 'University of Sydney', keywords: 'Immigration Law, Human Rights, Legal Advocacy', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMGxhd3llcnxlbnwxfHx8fDE3NjMyNjkyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbiUyMHJpZ2h0cyUyMGp1c3RpY2V8ZW58MXx8fHwxNzYzMjY5MjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Anika Sharma', profession: 'Environmental Law', role: 'Student', project: 'Climate Litigation Cases', uni: 'University of Melbourne', keywords: 'Climate Justice, Environmental Law, Legal Frameworks', photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMGxhd3llcnxlbnwxfHx8fDE3NjMyNjkyNDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnZpcm9ubWVudCUyMGp1c3RpY2V8ZW58MXx8fHwxNzYzMjY5MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                
                // Faculty
                { name: 'Aisha Rahman', profession: 'Geographer', role: 'Faculty', project: 'Monsoon Memories', uni: 'ANU Canberra', keywords: 'Weather Patterns, South Asia, Culture', photo: 'https://images.unsplash.com/photo-1618053448748-b7251851d014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcmVzZWFyY2hlcnxlbnwxfHx8fDE3NjMyNjg5NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1534388013589-18227eec6aab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zb29uJTIwcmFpbiUyMGFzaWF8ZW58MXx8fHwxNzYzMjY5MjIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Emma Thompson', profession: 'Marine Biologist', role: 'Faculty', project: 'Coral Guardians', uni: 'James Cook University', keywords: 'Marine Biology, Reefs, Pacific Islands', photo: 'https://images.unsplash.com/photo-1756588534346-e8899364757b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc2NpZW50aXN0fGVufDF8fHx8MTc2MzI2ODk1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1719042575585-e9d866f43210?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JhbCUyMHJlZWYlMjB1bmRlcndhdGVyfGVufDF8fHx8MTc2MzI0MjU1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Hassan Abdi', profession: 'Development Studies', role: 'Faculty', project: 'Sahel Food Security', uni: 'University of Sydney', keywords: 'Food Systems, Africa, Climate Resilience', photo: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwcHJvZmVzc29yfGVufDF8fHx8MTc2MzI2OTIzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1598978508200-e6c3f2d20b5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWhlbCUyMGFmcmljYSUyMGZhcm1pbmd8ZW58MXx8fHwxNzYzMjY5MjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Prof. Mei Lin Wu', profession: 'Urban Sociology', role: 'Faculty', project: 'Asian Megacities', uni: 'University of Melbourne', keywords: 'Urban Growth, Asia, Migration Patterns', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcHJvZmVzc29yfGVufDF8fHx8MTc2MzI2OTIzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhJTIwY2l0eSUyMHNreWxpbmV8ZW58MXx8fHwxNzYzMjY5MjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Roberto Vargas', profession: 'Environmental Anthropology', role: 'Faculty', project: 'Andean Water Politics', uni: 'University of Queensland', keywords: 'Water Rights, Latin America, Indigenous Knowledge', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1531168556467-80aace0d0144?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmRlcyUyMG1vdW50YWlucyUyMHdhdGVyfGVufDF8fHx8MTc2MzI2OTIzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Nadia Ivanova', profession: 'Visual Culture Studies', role: 'Faculty', project: 'Post-Soviet Identity', uni: 'UNSW Sydney', keywords: 'Identity, Photography, Eastern Europe', photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXJuJTIwZXVyb3BlYW4lMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1556122071-e404eefa1c5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXJuJTIwZXVyb3BlJTIwY2l0eXxlbnwxfHx8fDE3NjMyNjkyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Prof. Jamal Okeke', profession: 'Documentary Photography', role: 'Faculty', project: 'African Visual Heritage', uni: 'University of Cape Town', keywords: 'Documentary, African History, Visual Methods', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwcHJvZmVzc29yfGVufDF8fHx8MTc2MzI2OTIzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2ElMjBoZXJpdGFnZXxlbnwxfHx8fDE3NjMyNjkyMzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Lakshmi Devi', profession: 'Indigenous Studies', role: 'Faculty', project: 'Himalayan Communities', uni: 'University of Sydney', keywords: 'Indigenous Knowledge, Himalayas, Cultural Preservation', photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaW1hbGF5YXMlMjB2aWxsYWdlfGVufDF8fHx8MTc2MzI2OTIzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Prof. Thomas Anderson', profession: 'Human Geography', role: 'Faculty', project: 'Pacific Climate Migration', uni: 'ANU Canberra', keywords: 'Pacific Islands, Climate Displacement, Migration Studies', photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzb3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjMyNjkyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNpZmljJTIwaXNsYW5kc3xlbnwxfHx8fDE3NjMyNjkyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Fatou Diop', profession: 'Visual Communication', role: 'Faculty', project: 'West African Media Landscapes', uni: 'University of Melbourne', keywords: 'Media Studies, West Africa, Digital Communication', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwcm9mZXNzb3J8ZW58MXx8fHwxNzYzMjY5MjM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0JTIwYWZyaWNhJTIwbWVkaWF8ZW58MXx8fHwxNzYzMjY5MjM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Prof. Hiroshi Takahashi', profession: 'Pacific Studies', role: 'Faculty', project: 'Oceanic Connections', uni: 'University of Queensland', keywords: 'Pacific Culture, Maritime Heritage, Island Networks', photo: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMG1hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNpZmljJTIwb2NlYW58ZW58MXx8fHwxNjMyNjkyMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Prof. Catherine Dubois', profession: 'International Law', role: 'Faculty', project: 'War Crimes Documentation', uni: 'University of Sydney', keywords: 'International Law, Human Rights, Conflict Zones', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyNDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwbGF3JTIwanVzdGljZXxlbnwxfHx8fDE3NjMyNjkyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Dr. Marcus Bennett', profession: 'Indigenous Rights Law', role: 'Faculty', project: 'Land Rights & Visual Evidence', uni: 'ANU Canberra', keywords: 'Indigenous Rights, Land Claims, Legal Advocacy', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXN0cmFsaWFuJTIwbWFuJTIwcHJvZmVzc29yfGVufDF8fHx8MTc2MzI2OTI0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZ2Vub3VzJTIwbGFuZCUyMHJpZ2h0c3xlbnwxfHx8fDE3NjMyNjkyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                
                // Media
                { name: 'James O\'Connor', profession: 'Photojournalist', role: 'Media', project: 'Urban Resilience', uni: 'Melbourne University', keywords: 'Climate Adaptation, Cities, Documentary', photo: 'https://images.unsplash.com/photo-1641135698530-8d919344c0e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBqb3VybmFsaXN0fGVufDF8fHx8MTc2MzI2ODk1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1731432916713-576c0b6df6af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHJlc2lsaWVuY2UlMjBjaXR5fGVufDF8fHx8MTc2MzI2OTIyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Diego Hernández', profession: 'Journalist', role: 'Media', project: 'Border Crossings', uni: 'University of Queensland', keywords: 'Migration, Human Rights, Americas', photo: 'https://images.unsplash.com/photo-1648757766966-43d24bf7a264?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXNwYW5pYyUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzI2ODk1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1631627412230-cf651d683bca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3JkZXIlMjBjcm9zc2luZyUyMG1pZ3JhdGlvbnxlbnwxfHx8fDE3NjMyNjkyMjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Fatima Al-Said', profession: 'News Reporter', role: 'Media', project: 'Desert Bloom', uni: 'UNSW Sydney', keywords: 'Water Scarcity, Middle East, Innovation', photo: 'https://images.unsplash.com/photo-1740153204804-200310378f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwd29tYW4lMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzMjEwMzQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1720780528140-d518646107fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBvYXNpcyUyMGJsb29tfGVufDF8fHx8MTc2MzI2OTIyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Thiago Santos', profession: 'Investigative Journalist', role: 'Media', project: 'São Paulo Housing Crisis', uni: 'University of Sydney', keywords: 'Urban Inequality, Brazil, Housing Rights', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjBtYW4lMjBqb3VybmFsaXN0fGVufDF8fHx8MTc2MzI2OTIzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1624372647002-e281e6a1d4ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW8lMjBwYXVsbyUyMGhvdXNpbmd8ZW58MXx8fHwxNzYzMjY5MjMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Keisha Williams', profession: 'Documentary Filmmaker', role: 'Media', project: 'Caribbean Climate Stories', uni: 'James Cook University', keywords: 'Climate Justice, Caribbean, Visual Storytelling', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJpYmJlYW4lMjB3b21hbiUyMGpvdXJuYWxpc3R8ZW58MXx8fHwxNzYzMjY5MjM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJpYmJlYW4lMjBpc2xhbmRzfGVufDF8fHx8MTc2MzI2OTIzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Park Min-jun', profession: 'Visual Journalist', role: 'Media', project: 'Korean Tech Culture', uni: 'ANU Canberra', keywords: 'Technology, South Korea, Digital Society', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBtYW4lMjBqb3VybmFsaXN0fGVufDF8fHx8MTc2MzI2OTIzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzMjY5MjM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Anastasia Petrova', profession: 'Conflict Photographer', role: 'Media', project: 'Eastern Europe Tensions', uni: 'UNSW Sydney', keywords: 'Conflict Zones, Human Rights, Documentary', photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXJuJTIwZXVyb3BlYW4lMjB3b21hbiUyMGpvdXJuYWxpc3R8ZW58MXx8fHwxNzYzMjY5MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mbGljdCUyMHpvbmV8ZW58MXx8fHwxNzYzMjY5MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Raúl Méndez', profession: 'Photo Reporter', role: 'Media', project: 'Central America Migration', uni: 'University of Sydney', keywords: 'Migration Routes, Central America, Social Justice', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMHBob3RvZ3JhcGhlcnxlbnwxfHx8fDE3NjMyNjkyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZW50cmFsJTIwYW1lcmljYSUyMG1pZ3JhdGlvbnxlbnwxfHx8fDE3NjMyNjkyNDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Aminata Traoré', profession: 'International Correspondent', role: 'Media', project: 'Sahel Security Crisis', uni: 'University of Melbourne', keywords: 'Security, Sahel Region, Investigative Reporting', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBqb3VybmFsaXN0fGVufDF8fHx8MTc2MzI2OTI0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWhlbCUyMGFmcmljYXxlbnwxfHx8fDE3NjMyNjkyNDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Omar Farouk', profession: 'Visual Storyteller', role: 'Media', project: 'MENA Youth Voices', uni: 'James Cook University', keywords: 'Middle East, Youth Culture, Visual Narrative', photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwbWFuJTIwam91cm5hbGlzdHxlbnwxfHx8fDE3NjMyNjkyNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0JTIweW91dGh8ZW58MXx8fHwxNzYzMjY5MjQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Julia Martins', profession: 'Legal Correspondent', role: 'Media', project: 'Refugee Rights Coverage', uni: 'University of Queensland', keywords: 'Refugee Law, Media Ethics, Legal Journalism', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGpvdXJuYWxpc3QlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzMjY5MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWZ1Z2VlJTIwY2FtcHxlbnwxfHx8fDE3NjMyNjkyNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Samuel Osei', profession: 'Human Rights Reporter', role: 'Media', project: 'Ghana Land Disputes', uni: 'University of Sydney', keywords: 'Land Rights, Ghana, Legal Documentation', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwam91cm5hbGlzdHxlbnwxfHx8fDE3NjMyNjkyNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1589271243960-0c7cc0d99cbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYWFuYSUyMGxhbmQlMjBydXJhbHxlbnwxfHx8fDE3NjMyNjkyNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                // Collaborators - Photographers from the Map Projects
                { name: 'Cinthia Karina Baños Paredes', profession: 'Ethnologist', role: 'Collaborator', project: 'Toxo\'o o tsui\' kiee\'n: Day of the Death', uni: 'National School of Anthropology and History (ENAH)', keywords: 'Mazatec Culture, Day of the Dead, Visual Anthropology', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwwfHx8fDE3MzE2OTM2NzV8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1572454591674-2739f30d8c40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXklMjBvZiUyMGRlYWQlMjBtZXhpY298ZW58MXx8fHwxNzYzMjY5MjIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Sarah Mitchell', profession: 'Biologist', role: 'Collaborator', project: 'Vanishing Giants: Elephants of Kenya', uni: 'University of Nairobi', keywords: 'Wildlife Conservation, Human-Elephant Conflict, Kenya', photo: 'https://images.unsplash.com/photo-1618876561985-ff3a14af4cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBob3RvZ3JhcGhlciUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjMxNzM2NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1520327155548-c80b5e82e883?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLZW55YSUyMGVsZXBoYW50JTIwd2lsZGxpZmV8ZW58MXx8fHwxNzYzMTc3MDQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'David Chen', profession: 'Anthropologist', role: 'Collaborator', project: 'The Last Shamans of Mongolia', uni: 'National University of Mongolia', keywords: 'Shamanism, Mongolian Culture, Ritual Practices', photo: 'https://images.unsplash.com/photo-1611082868502-854d01236452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHBob3RvZ3JhcGhlciUyMGhlYWRzaG90fGVufDF8fHx8MTc2MzE3MzY3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1547370828-2e0c386ea8da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNb25nb2xpYSUyMHNoYW1hbiUyMHJpdHVhbHxlbnwxfHx8fDE3NjMxNzcwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Marcus Johnson', profession: 'Sociologist', role: 'Collaborator', project: 'Brooklyn After Dark', uni: 'CUNY Brooklyn College', keywords: 'Urban Studies, New York, Nightlife Culture', photo: 'https://images.unsplash.com/photo-1676304918177-d60a7e1c7218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwcGhvdG9qb3VybmFsaXN0JTIwcG9ydHJhaXR8ZW58MXx8fHwxNjMxNzM2NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9va2x5biUyMG5pZ2h0JTIwdXJiYW58ZW58MXx8fHwxNzYzMjY5MjIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Amira Hassan', profession: 'Geographer', role: 'Collaborator', project: 'Maldives: Paradise in Peril', uni: 'Maldives National University', keywords: 'Climate Change, Islands, Sea Level Rise', photo: 'https://images.unsplash.com/photo-1629326329861-995081617bc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwam91cm5hbGlzdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjMxNzM2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1663785224955-c5f1a8c3978b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWxkaXZlcyUyMGlzbGFuZCUyMG9jZWFufGVufDF8fHx8MTc2MzE2OTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Priya Sharma', profession: 'Political Scientist', role: 'Collaborator', project: 'Gen Z Revolution: Nepal 2024', uni: 'Tribhuvan University', keywords: 'Youth Politics, Social Movements, Nepal', photo: 'https://images.unsplash.com/photo-1753620943983-d030f232e12b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGpvdXJuYWxpc3QlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjMxNzM2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMHByb3Rlc3QlMjB5b3V0aHxlbnwxfHx8fDE3NjMyNjkyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Erik Johansen', profession: 'Biologist', role: 'Collaborator', project: 'Arctic Wolves in Crisis', uni: 'University of Greenland', keywords: 'Arctic Wildlife, Climate Adaptation, Greenland', photo: 'https://images.unsplash.com/photo-1554324283-2791e636d291?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldXJvcGVhbiUyMHBob3Rvam91cm5hbGlzdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzE3MzY3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1669067943780-a6dc725b1ef5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBcmN0aWMlMjB3b2xmfGVufDF8fHx8MTc2MzE3NzEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Yuki Tanaka', profession: 'Sociologist', role: 'Collaborator', project: 'Tokyo: Micro Living', uni: 'Waseda University', keywords: 'Urban Density, Japanese Society, Minimalism', photo: 'https://images.unsplash.com/photo-1663043188237-01565028db93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N1bWVudGFyeSUyMHBob3RvZ3JhcGhlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzE3MzY3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1614246932428-40569a3a59c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMGFwYXJ0bWVudHxlbnwxfHx8fDE3NjMxNzcxNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Jean-Paul Dubois', profession: 'Biologist', role: 'Collaborator', project: 'Madagascar: Lemurs Last Stand', uni: 'University of Antananarivo', keywords: 'Madagascar Wildlife, Lemur Conservation, Biodiversity', photo: 'https://images.unsplash.com/photo-1618053448748-b7251851d014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaW9sb2dpc3QlMjByZXNlYXJjaGVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYzMTczNjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1604886214809-d49665de0e45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwbGVtdXJ8ZW58MXx8fHwxNzYzMTc3MTczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Maria Gonzalez', profession: 'Lawyer', role: 'Collaborator', project: 'ICE Raids: Families in Fear', uni: 'UCLA School of Law', keywords: 'Immigration Law, Human Rights, Los Angeles', photo: 'https://images.unsplash.com/photo-1597759337613-046b458dca56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqb3VybmFsaXN0JTIwcG9ydHJhaXQlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjMxNzM2NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1525075390898-b0d062e04661?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMb3MlMjBBbmdlbGVzJTIwaW1taWdyYXRpb258ZW58MXx8fHwxNzYzMTc3MTczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Aroha Williams', profession: 'Anthropologist', role: 'Collaborator', project: 'Maori Tattoo Revival', uni: 'University of Waikato', keywords: 'Maori Culture, Traditional Tattoo, New Zealand', photo: 'https://images.unsplash.com/photo-1760638261420-ad9acd4e0c1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZ2Vub3VzJTIwcGhvdG9ncmFwaGVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYzMTczNjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1715312934406-b542cb7abf88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOZXclMjBaZWFsYW5kJTIwTWFvcml8ZW58MXx8fHwxNzYzMTc1MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                { name: 'Olena Kovalenko', profession: 'Internationalist', role: 'Collaborator', project: 'Ukraine: Voices from the Frontline', uni: 'Taras Shevchenko National University of Kyiv', keywords: 'Conflict Journalism, Resilience, Ukraine', photo: 'https://images.unsplash.com/photo-1561350683-fc1906fbfd2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW9ncmFwaGVyJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYzMTczNjc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', cover: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1a3JhaW5lJTIwY2l0eSUyMHJlc2lsaWVuY2V8ZW58MXx8fHwxNzYzMjY5MjI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
              ].filter((member) => {
                if (memberFilter === 'all') return true;
                if (memberFilter === 'students') return member.role === 'Student';
                if (memberFilter === 'faculty') return member.role === 'Faculty';
                if (memberFilter === 'media') return member.role === 'Media';
                if (memberFilter === 'field') return member.role === 'Collaborator';
                return true;
              }).map((member, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg border border-[#E8E5DC]">
                  <div className="h-32 relative overflow-hidden">
                    <img 
                      src={member.cover} 
                      alt={`${member.project} cover`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
                    <div className="absolute top-2 right-2 px-3 py-1 bg-[#0EA5E9] rounded-full text-xs text-white shadow-md" style={{ fontFamily: 'Georgia, serif' }}>
                      {member.role}
                    </div>
                  </div>
                  <div className="p-5 -mt-10 relative">
                    <div className="w-20 h-20 rounded-full border-4 border-white mb-3 mx-auto overflow-hidden bg-gray-200">
                      <img 
                        src={member.photo} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-center text-lg mb-1 text-[#424242]" style={{ fontFamily: 'Georgia, serif' }}>{member.name}</h3>
                    <p className="text-center text-xs text-[#E64626] mb-1">{member.profession}</p>
                    <p className="text-center text-sm text-[#424242]/80 mb-2">{member.project}</p>
                    <p className="text-center text-xs text-[#8C8279] mb-4">{member.uni}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-[#E64626] text-white rounded text-sm hover:bg-[#F68B1F] transition-colors shadow-sm text-center">
                        Add to contacts
                      </button>
                      <button className="flex-1 px-3 py-2 bg-[#C9A86A] text-white rounded text-sm hover:bg-[#D4AF37] transition-colors shadow-sm text-center">
                        Send message
                      </button>
                    </div>
                    <p className="text-center text-xs text-[#8C8279] mt-3">{member.keywords}</p>
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* Forum Thread Detail */}
          <ForumThreadDetail
            post={selectedThread}
            open={isThreadOpen}
            onClose={() => {
              setIsThreadOpen(false);
              setTimeout(() => setSelectedThread(null), 300);
            }}
          />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
