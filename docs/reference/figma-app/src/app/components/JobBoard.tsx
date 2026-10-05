import { useState } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, Mail, Building2, SlidersHorizontal, X, Search } from 'lucide-react';
import { JobPosting, JobCategory, JobType } from '../types';
import { jobPostings } from '../data/mockData';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';

export function JobBoard() {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    jobType: [] as string[],
    location: [] as string[],
    remote: null as boolean | null,
    organization: [] as string[],
    role: [] as string[],
    salaryRange: null as string | null,
  });

  const categories = [
    { id: 'all' as const, label: 'All Opportunities', color: '#E64626' },
    { id: 'journalism' as JobCategory, label: 'Journalism', color: '#F68B1F' },
    { id: 'analysis' as JobCategory, label: 'International Analysis', color: '#C9A86A' },
    { id: 'media' as JobCategory, label: 'Media', color: '#E64626' },
    { id: 'business' as JobCategory, label: 'Business Affairs', color: '#424242' },
    { id: 'cultural' as JobCategory, label: 'Cultural Management', color: '#F68B1F' },
    { id: 'embassy' as JobCategory, label: 'Embassies', color: '#C9A86A' },
    { id: 'international-org' as JobCategory, label: 'International Organizations', color: '#E64626' },
    { id: 'legal' as JobCategory, label: 'Legal Advisory', color: '#424242' },
    { id: 'freelance' as JobCategory, label: 'Freelance', color: '#F68B1F' },
    { id: 'public-relations' as JobCategory, label: 'Public Relations', color: '#C9A86A' },
    { id: 'government' as JobCategory, label: 'Government', color: '#424242' },
    { id: 'scholarships' as JobCategory, label: 'Scholarships', color: '#F68B1F' },
  ];

  const filteredJobs = jobPostings.filter((job) => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    
    // Search query
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Advanced filters
    const matchesJobType = advancedFilters.jobType.length === 0 || 
      advancedFilters.jobType.includes(job.type);
    
    const matchesLocation = advancedFilters.location.length === 0 || 
      advancedFilters.location.includes(job.country);
    
    const matchesRemote = advancedFilters.remote === null || 
      job.remote === advancedFilters.remote;
    
    const matchesOrganization = advancedFilters.organization.length === 0 || 
      advancedFilters.organization.includes(job.organization);
    
    const matchesRole = advancedFilters.role.length === 0 || 
      advancedFilters.role.includes(job.category);
    
    // Salary range filter
    const matchesSalary = !advancedFilters.salaryRange || !job.salary || (() => {
      const salaryText = job.salary.toLowerCase();
      const range = advancedFilters.salaryRange;
      
      // Extract numbers from salary string (handle formats like "$50,000 - $70,000" or "€60,000/year")
      const numbers = salaryText.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''))) || [];
      if (numbers.length === 0) return true; // If no numbers found, don't filter out
      
      const minSalary = Math.min(...numbers);
      
      switch(range) {
        case '0-30k': return minSalary < 30000;
        case '30k-50k': return minSalary >= 30000 && minSalary < 50000;
        case '50k-70k': return minSalary >= 50000 && minSalary < 70000;
        case '70k-100k': return minSalary >= 70000 && minSalary < 100000;
        case '100k+': return minSalary >= 100000;
        default: return true;
      }
    })();
    
    return matchesCategory && matchesSearch && matchesJobType && matchesLocation && matchesRemote && matchesOrganization && matchesRole && matchesSalary;
  });

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full-time': 'Full-Time',
      'part-time': 'Part-Time',
      'contract': 'Contract',
      'freelance': 'Freelance',
      'internship': 'Internship'
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category: JobCategory) => {
    return categories.find(cat => cat.id === category)?.label || category;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'journalism': 'Journalism',
      'analysis': 'International Analysis',
      'media': 'Media & Broadcasting',
      'business': 'Business & Corporate',
      'cultural': 'Cultural & Arts',
      'embassy': 'Diplomacy & Embassies',
      'international-org': 'International Organizations',
      'legal': 'Legal & Advisory',
      'freelance': 'Freelance & Independent'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar with Advanced Search */}
      <div className="mb-8 max-w-3xl mx-auto">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search jobs by title, organization, or keywords..."
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
                  Advanced Job Search
                </DialogTitle>
                <DialogDescription className="text-[#8C8279]">
                  Refine your search with additional filters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Job Type */}
                <div className="space-y-2">
                  <Label htmlFor="jobType" className="text-[#424242]">Job Type</Label>
                  <Select onValueChange={(value) => {
                    if (!advancedFilters.jobType.includes(value)) {
                      setAdvancedFilters({...advancedFilters, jobType: [...advancedFilters.jobType, value]});
                    }
                  }}>
                    <SelectTrigger id="jobType" className="border-[#E8E5DC]">
                      <SelectValue placeholder="Add job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time</SelectItem>
                      <SelectItem value="part-time">Part-Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  {advancedFilters.jobType.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {advancedFilters.jobType.map((type) => (
                        <div key={type} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                          <span>{getJobTypeLabel(type)}</span>
                          <button
                            onClick={() => setAdvancedFilters({
                              ...advancedFilters,
                              jobType: advancedFilters.jobType.filter(t => t !== type)
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

                {/* Location/Country */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[#424242]">Country</Label>
                  <Select onValueChange={(value) => {
                    if (!advancedFilters.location.includes(value)) {
                      setAdvancedFilters({...advancedFilters, location: [...advancedFilters.location, value]});
                    }
                  }}>
                    <SelectTrigger id="location" className="border-[#E8E5DC]">
                      <SelectValue placeholder="Add country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="España">Spain</SelectItem>
                      <SelectItem value="México">Mexico</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Estados Unidos">United States</SelectItem>
                      <SelectItem value="Reino Unido">United Kingdom</SelectItem>
                      <SelectItem value="Francia">France</SelectItem>
                      <SelectItem value="Bélgica">Belgium</SelectItem>
                      <SelectItem value="Global">Global</SelectItem>
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

                {/* Role/Field */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[#424242]">Professional Field</Label>
                  <Select onValueChange={(value) => {
                    if (!advancedFilters.role.includes(value)) {
                      setAdvancedFilters({...advancedFilters, role: [...advancedFilters.role, value]});
                    }
                  }}>
                    <SelectTrigger id="role" className="border-[#E8E5DC]">
                      <SelectValue placeholder="Add field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journalism">Journalism</SelectItem>
                      <SelectItem value="analysis">International Analysis</SelectItem>
                      <SelectItem value="media">Media & Broadcasting</SelectItem>
                      <SelectItem value="business">Business & Corporate</SelectItem>
                      <SelectItem value="cultural">Cultural & Arts</SelectItem>
                      <SelectItem value="embassy">Diplomacy & Embassies</SelectItem>
                      <SelectItem value="international-org">International Organizations</SelectItem>
                      <SelectItem value="legal">Legal & Advisory</SelectItem>
                      <SelectItem value="freelance">Freelance & Independent</SelectItem>
                    </SelectContent>
                  </Select>
                  {advancedFilters.role.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {advancedFilters.role.map((role) => (
                        <div key={role} className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                          <span>{getRoleLabel(role)}</span>
                          <button
                            onClick={() => setAdvancedFilters({
                              ...advancedFilters,
                              role: advancedFilters.role.filter(r => r !== role)
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

                {/* Remote */}
                <div className="space-y-2">
                  <Label htmlFor="remote" className="text-[#424242]">Remote Work</Label>
                  <Select onValueChange={(value) => {
                    setAdvancedFilters({...advancedFilters, remote: value === 'true' ? true : value === 'false' ? false : null});
                  }}>
                    <SelectTrigger id="remote" className="border-[#E8E5DC]">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Remote Only</SelectItem>
                      <SelectItem value="false">On-site Only</SelectItem>
                    </SelectContent>
                  </Select>
                  {advancedFilters.remote !== null && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-[#F68B1F] text-white px-3 py-1 rounded-full text-sm">
                        <span>{advancedFilters.remote ? 'Remote Only' : 'On-site Only'}</span>
                        <button
                          onClick={() => setAdvancedFilters({...advancedFilters, remote: null})}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Salary Range */}
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-[#424242]">Rango Salarial</Label>
                  <Select onValueChange={(value) => {
                    setAdvancedFilters({...advancedFilters, salaryRange: value === 'any' ? null : value});
                  }}>
                    <SelectTrigger id="salary" className="border-[#E8E5DC]">
                      <SelectValue placeholder="Cualquier salario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquier salario</SelectItem>
                      <SelectItem value="0-30k">Menos de $30,000</SelectItem>
                      <SelectItem value="30k-50k">$30,000 - $50,000</SelectItem>
                      <SelectItem value="50k-70k">$50,000 - $70,000</SelectItem>
                      <SelectItem value="70k-100k">$70,000 - $100,000</SelectItem>
                      <SelectItem value="100k+">Más de $100,000</SelectItem>
                    </SelectContent>
                  </Select>
                  {advancedFilters.salaryRange && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-[#C9A86A] text-white px-3 py-1 rounded-full text-sm">
                        <DollarSign className="w-3 h-3" />
                        <span>
                          {advancedFilters.salaryRange === '0-30k' && 'Menos de $30,000'}
                          {advancedFilters.salaryRange === '30k-50k' && '$30,000 - $50,000'}
                          {advancedFilters.salaryRange === '50k-70k' && '$50,000 - $70,000'}
                          {advancedFilters.salaryRange === '70k-100k' && '$70,000 - $100,000'}
                          {advancedFilters.salaryRange === '100k+' && 'Más de $100,000'}
                        </span>
                        <button
                          onClick={() => setAdvancedFilters({...advancedFilters, salaryRange: null})}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdvancedFilters({ jobType: [], location: [], remote: null, organization: [], role: [], salaryRange: null });
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

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm transition-all shadow-md ${
              selectedCategory === cat.id
                ? 'bg-[#F68B1F] text-white'
                : 'bg-white/90 hover:bg-white text-[#424242]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-center">
        <p className="text-white text-lg">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity found' : 'opportunities found'}
        </p>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="space-y-3">
              {job.image && (
                <div className="w-full h-48 rounded-lg overflow-hidden mb-3">
                  <img 
                    src={job.image} 
                    alt={job.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-xl mb-2 text-[#424242]">{job.title}</h3>
                  <div className="flex items-center gap-2 text-[#F68B1F] mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="text-base">{job.organization}</span>
                  </div>
                </div>
                <Briefcase className="w-6 h-6 text-[#E64626] flex-shrink-0" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#E64626] hover:bg-[#F68B1F] text-white">
                  {getCategoryLabel(job.category)}
                </Badge>
                <Badge variant="outline" className="border-[#C9A86A] text-[#424242]">
                  {getJobTypeLabel(job.type)}
                </Badge>
                {job.remote && (
                  <Badge variant="outline" className="border-[#F68B1F] text-[#F68B1F]">
                    Remote
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-[#424242] text-sm leading-relaxed">
                {job.description}
              </p>

              <div className="space-y-2 text-sm text-[#424242]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#F68B1F] flex-shrink-0" />
                  <span>{job.location}, {job.country}</span>
                </div>
                
                {job.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C9A86A] flex-shrink-0" />
                    <span>{job.salary}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E64626] flex-shrink-0" />
                  <span>Deadline: {new Date(job.deadline).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>

              {/* Requirements preview */}
              <div className="bg-[#FFF9F0] p-3 rounded-lg">
                <h4 className="text-sm text-[#424242] mb-2">Key Requirements:</h4>
                <ul className="text-xs text-[#424242] space-y-1">
                  {job.requirements.slice(0, 3).map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#F68B1F] flex-shrink-0">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                  {job.requirements.length > 3 && (
                    <li className="text-[#8C8279] italic">
                      +{job.requirements.length - 3} more requirements...
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {job.applyUrl ? (
                  <Button 
                    className="flex-1 bg-[#E64626] hover:bg-[#F68B1F] text-white"
                    onClick={() => window.open(job.applyUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                ) : job.contactEmail ? (
                  <Button 
                    className="flex-1 bg-[#E64626] hover:bg-[#F68B1F] text-white"
                    onClick={() => window.location.href = `mailto:${job.contactEmail}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                ) : null}
                
                <Button 
                  variant="outline" 
                  className="border-[#E64626] text-[#E64626] hover:bg-[#FFF9F0]"
                  onClick={() => {
                    // Open modal with full job details
                    alert('View full details: ' + job.title);
                  }}
                >
                  View More
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <Briefcase className="w-16 h-16 text-[#C9A86A] mx-auto mb-4" />
            <h3 className="text-xl text-[#424242] mb-2">No opportunities available</h3>
            <p className="text-[#8C8279]">
              Try selecting another category or check back later for new listings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}