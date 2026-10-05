import { useState, useMemo } from 'react';
import { Calendar, MapPin, Globe, Award, Users, Building2, GraduationCap, Search, Filter, ChevronDown } from 'lucide-react';
import { AcademicEvent, EventCategory, EventFormat, EventTheme } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// Mock Data de Eventos Académicos
const mockEvents: AcademicEvent[] = [
  // COMPETENCIAS
  {
    id: 'comp-1',
    title: 'International Relations Essay Competition 2025',
    category: 'competitions',
    description: 'Annual essay competition for undergraduate students on global governance and diplomacy.',
    longDescription: 'This prestigious competition invites undergraduate students worldwide to submit original essays addressing contemporary challenges in international relations. Winners receive scholarships and publication opportunities.',
    university: 'University of Oxford',
    organizer: 'Department of Politics and International Relations',
    researcher: 'Dr. Sarah Mitchell',
    format: 'virtual',
    location: 'Online',
    country: 'United Kingdom',
    date: '2025-06-15',
    deadline: '2025-03-31',
    theme: ['International Relations', 'Conflict Resolution'],
    targetAudience: ['Undergraduate Students', 'Graduate Students'],
    language: ['English'],
    prize: '£5,000 + Publication',
    registration: 'https://oxford.ac.uk/ir-competition',
    image: 'https://images.unsplash.com/photo-1715071203994-9181bb2a41b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3NheSUyMGNvbXBldGl0aW9ufGVufDF8fHx8MTc2MzQ0MDk3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'comp-2',
    title: 'Latin American Development Studies Competition',
    category: 'competitions',
    description: 'Research competition focused on sustainable development challenges in Latin America.',
    longDescription: 'Students are invited to present innovative research proposals addressing development challenges across Latin America, with focus on sustainability and social justice.',
    university: 'Universidad Nacional Autónoma de México (UNAM)',
    organizer: 'Instituto de Investigaciones Sociales',
    researcher: 'Dra. Carmen Rodríguez',
    format: 'presencial',
    location: 'Ciudad de México',
    country: 'Mexico',
    date: '2025-05-20',
    deadline: '2025-04-01',
    theme: ['Development Studies', 'Climate Change'],
    targetAudience: ['Graduate Students', 'PhD Candidates'],
    language: ['Spanish', 'English'],
    prize: '$10,000 USD + Research Grant',
    registration: 'https://unam.mx/dev-competition',
    image: 'https://images.unsplash.com/photo-1715419048742-cb9cfe6aa54b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY29tcGV0aXRpb258ZW58MXx8fHwxNzYzNDQwOTcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'comp-3',
    title: 'Global Human Rights Case Study Competition',
    category: 'competitions',
    description: 'International competition analyzing contemporary human rights cases and proposing solutions.',
    university: 'University of Toronto',
    organizer: 'Munk School of Global Affairs',
    researcher: 'Prof. David Chen',
    format: 'hybrid',
    location: 'Toronto, ON',
    country: 'Canada',
    date: '2025-07-10',
    deadline: '2025-05-15',
    theme: ['Human Rights', 'International Relations'],
    targetAudience: ['Undergraduate Students', 'Graduate Students', 'Professionals'],
    language: ['English', 'French'],
    prize: 'CAD $8,000 + Conference Attendance',
    registration: 'https://utoronto.ca/hr-competition',
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwcmVsYXRpb25zfGVufDF8fHx8MTc2MzQ0MDk3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  
  // COLOQUIOS
  {
    id: 'coll-1',
    title: 'International Symposium on Migration and Security',
    category: 'colloquia',
    description: 'Three-day symposium exploring the intersection of migration policies and international security.',
    longDescription: 'Leading scholars and policymakers convene to discuss contemporary challenges at the nexus of migration and security, featuring keynote speakers, panel discussions, and networking opportunities.',
    university: 'Sciences Po Paris',
    organizer: 'Centre for International Studies',
    researcher: 'Prof. Marie Dubois',
    format: 'presencial',
    location: 'Paris',
    country: 'France',
    date: '2025-09-12',
    deadline: '2025-06-30',
    theme: ['Migration', 'International Relations'],
    targetAudience: ['Researchers', 'PhD Candidates', 'Professionals'],
    language: ['English', 'French'],
    registration: 'https://sciencespo.fr/migration-symposium',
    image: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMGNvbmZlcmVuY2V8ZW58MXx8fHwxNzYzMzQ4MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'coll-2',
    title: 'Coloquio Latinoamericano de Relaciones Internacionales',
    category: 'colloquia',
    description: 'Regional forum for discussing emerging trends in Latin American international relations.',
    longDescription: 'Annual gathering of scholars, diplomats, and students to analyze contemporary issues affecting Latin American foreign policy, regional integration, and global positioning.',
    university: 'Pontificia Universidad Católica de Chile',
    organizer: 'Instituto de Ciencia Política',
    researcher: 'Dr. Alejandro Silva',
    format: 'hybrid',
    location: 'Santiago',
    country: 'Chile',
    date: '2025-08-25',
    deadline: '2025-07-01',
    theme: ['International Relations', 'Development Studies'],
    targetAudience: ['Researchers', 'Graduate Students', 'Diplomats'],
    language: ['Spanish', 'Portuguese'],
    registration: 'https://uc.cl/coloquio-rrii',
    image: 'https://images.unsplash.com/photo-1762158007836-25d13ab34c1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMHN5bXBvc2l1bXxlbnwxfHx8fDE3NjM0NDA5NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'coll-3',
    title: 'Climate Diplomacy and Global Governance Conference',
    category: 'colloquia',
    description: 'International conference addressing climate change through diplomatic and governance frameworks.',
    university: 'University of Cape Town',
    organizer: 'Environmental Policy Research Centre',
    researcher: 'Dr. Nomvula Khumalo',
    format: 'presencial',
    location: 'Cape Town',
    country: 'South Africa',
    date: '2025-10-05',
    deadline: '2025-08-01',
    theme: ['Climate Change', 'International Relations'],
    targetAudience: ['Researchers', 'Policymakers', 'NGO Representatives'],
    language: ['English'],
    registration: 'https://uct.ac.za/climate-conference',
    image: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMGNvbmZlcmVuY2V8ZW58MXx8fHwxNzYzMzQ4MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  
  // FOTOGRAFÍA
  {
    id: 'photo-1',
    title: 'World Press Photo Exhibition & Masterclass',
    category: 'photography',
    description: 'Annual exhibition of award-winning photojournalism with workshops by renowned photographers.',
    longDescription: 'Experience the world\'s most powerful visual stories at this prestigious exhibition, followed by intensive masterclasses covering documentary photography, visual storytelling, and ethical journalism.',
    university: 'New York University',
    organizer: 'Tisch School of the Arts',
    researcher: 'Prof. James Anderson',
    format: 'presencial',
    location: 'New York, NY',
    country: 'United States',
    date: '2025-04-18',
    deadline: '2025-03-15',
    theme: ['Photojournalism', 'Documentary Photography'],
    targetAudience: ['Photographers', 'Students', 'Journalists'],
    language: ['English'],
    registration: 'https://nyu.edu/worldpress',
    image: 'https://images.unsplash.com/photo-1591465897645-defc964ef202?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90b2pvdXJuYWxpc218ZW58MXx8fHwxNzYzNDk2OTQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'photo-2',
    title: 'Visual Anthropology Workshop: Documenting Cultural Heritage',
    category: 'photography',
    description: 'Intensive workshop on visual anthropology methods and ethical cultural documentation.',
    longDescription: 'Learn from leading visual anthropologists how to document cultural practices respectfully and effectively, combining academic rigor with creative photographic techniques.',
    university: 'University of Melbourne',
    organizer: 'School of Social and Political Sciences',
    researcher: 'Dr. Emma Thompson',
    format: 'hybrid',
    location: 'Melbourne, VIC',
    country: 'Australia',
    date: '2025-06-08',
    deadline: '2025-05-01',
    theme: ['Visual Anthropology', 'Documentary Photography'],
    targetAudience: ['Graduate Students', 'Photographers', 'Anthropologists'],
    language: ['English'],
    registration: 'https://unimelb.edu.au/visual-workshop',
    image: 'https://images.unsplash.com/photo-1752649938524-68d3fe1fd863?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90b2dyYXBoeSUyMHdvcmtzaG9wfGVufDF8fHx8MTc2MzQ1ODgwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'photo-3',
    title: 'Latin American Documentary Photography Festival',
    category: 'photography',
    description: 'Festival celebrating documentary photography from across Latin America with portfolio reviews.',
    longDescription: 'A week-long celebration of Latin American visual storytelling featuring exhibitions, portfolio reviews with industry professionals, and networking opportunities for emerging photographers.',
    university: 'Universidad de Chile',
    organizer: 'Facultad de Artes',
    researcher: 'Prof. Ricardo Vargas',
    format: 'presencial',
    location: 'Santiago',
    country: 'Chile',
    date: '2025-11-20',
    deadline: '2025-09-30',
    theme: ['Documentary Photography', 'Photojournalism'],
    targetAudience: ['Photographers', 'Students', 'Curators'],
    language: ['Spanish', 'English'],
    registration: 'https://uchile.cl/photo-festival',
    image: 'https://images.unsplash.com/photo-1713779390626-11c5d0d4a896?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGdhbGxlcnklMjBhcnR8ZW58MXx8fHwxNzYzNDgxMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
];

// Extrae opciones únicas para filtros
const universities = Array.from(new Set(mockEvents.map(e => e.university))).sort();
const countries = Array.from(new Set(mockEvents.map(e => e.country))).sort();
const themes = Array.from(new Set(mockEvents.flatMap(e => e.theme))).sort();
const researchers = Array.from(new Set(mockEvents.map(e => e.researcher).filter(Boolean))).sort() as string[];

export function Events() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filtros avanzados
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<EventFormat | 'all'>('all');
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterResearcher, setFilterResearcher] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    return mockEvents.filter(event => {
      // Filtro de categoría
      if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
      
      // Búsqueda por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.university.toLowerCase().includes(query) ||
          event.organizer?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Filtros avanzados
      if (filterUniversity !== 'all' && event.university !== filterUniversity) return false;
      if (filterFormat !== 'all' && event.format !== filterFormat) return false;
      if (filterTheme !== 'all' && !event.theme.includes(filterTheme as EventTheme)) return false;
      if (filterResearcher !== 'all' && event.researcher !== filterResearcher) return false;
      if (filterCountry !== 'all' && event.country !== filterCountry) return false;
      
      return true;
    });
  }, [selectedCategory, searchQuery, filterUniversity, filterFormat, filterTheme, filterResearcher, filterCountry]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUniversity('all');
    setFilterFormat('all');
    setFilterTheme('all');
    setFilterResearcher('all');
    setFilterCountry('all');
  };

  const hasActiveFilters = searchQuery || filterUniversity !== 'all' || filterFormat !== 'all' || 
    filterTheme !== 'all' || filterResearcher !== 'all' || filterCountry !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F2E8]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#E64626] mb-4 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
            ACADEMIC EVENTS
          </h1>
          <p className="text-[#424242] max-w-3xl mx-auto text-lg">
            Discover international competitions, colloquia, and photography events organized by leading academic institutions worldwide.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-lg transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#E64626] text-white shadow-lg'
                  : 'bg-white text-[#424242] border border-[#E8E5DC] hover:border-[#E64626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                All Events ({mockEvents.length})
              </span>
            </button>
            <button
              onClick={() => setSelectedCategory('competitions')}
              className={`px-6 py-3 rounded-lg transition-all ${
                selectedCategory === 'competitions'
                  ? 'bg-[#E64626] text-white shadow-lg'
                  : 'bg-white text-[#424242] border border-[#E8E5DC] hover:border-[#E64626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Competitions & Essays ({mockEvents.filter(e => e.category === 'competitions').length})
              </span>
            </button>
            <button
              onClick={() => setSelectedCategory('colloquia')}
              className={`px-6 py-3 rounded-lg transition-all ${
                selectedCategory === 'colloquia'
                  ? 'bg-[#E64626] text-white shadow-lg'
                  : 'bg-white text-[#424242] border border-[#E8E5DC] hover:border-[#E64626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Colloquiums & Conferences ({mockEvents.filter(e => e.category === 'colloquia').length})
              </span>
            </button>
            <button
              onClick={() => setSelectedCategory('photography')}
              className={`px-6 py-3 rounded-lg transition-all ${
                selectedCategory === 'photography'
                  ? 'bg-[#E64626] text-white shadow-lg'
                  : 'bg-white text-[#424242] border border-[#E8E5DC] hover:border-[#E64626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Photography Events ({mockEvents.filter(e => e.category === 'photography').length})
              </span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events by title, university, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-[#E64626] hover:text-[#F68B1F] transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              {/* Universidad */}
              <div>
                <label className="text-sm text-[#424242] mb-2 block">University</label>
                <Select value={filterUniversity} onValueChange={setFilterUniversity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All universities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All universities</SelectItem>
                    {universities.map(uni => (
                      <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formato */}
              <div>
                <label className="text-sm text-[#424242] mb-2 block">Format</label>
                <Select value={filterFormat} onValueChange={(v) => setFilterFormat(v as EventFormat | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All formats</SelectItem>
                    <SelectItem value="presencial">In-person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tema */}
              <div>
                <label className="text-sm text-[#424242] mb-2 block">Theme</label>
                <Select value={filterTheme} onValueChange={setFilterTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="All themes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All themes</SelectItem>
                    {themes.map(theme => (
                      <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* País */}
              <div>
                <label className="text-sm text-[#424242] mb-2 block">Country</label>
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Investigador */}
              <div>
                <label className="text-sm text-[#424242] mb-2 block">Researcher/Organizer</label>
                <Select value={filterResearcher} onValueChange={setFilterResearcher}>
                  <SelectTrigger>
                    <SelectValue placeholder="All researchers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All researchers</SelectItem>
                    {researchers.map(researcher => (
                      <SelectItem key={researcher} value={researcher}>{researcher}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-[#424242]">
            Showing <span className="text-[#E64626]">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#424242] text-lg mb-4">No events found matching your criteria.</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: AcademicEvent }) {
  const formatIcons = {
    presencial: <MapPin className="w-4 h-4" />,
    virtual: <Globe className="w-4 h-4" />,
    hybrid: <Globe className="w-4 h-4" />
  };

  const categoryLabels = {
    competitions: 'Competition',
    colloquia: 'Colloquium',
    photography: 'Photography'
  };

  const categoryColors = {
    competitions: 'bg-[#E64626]',
    colloquia: 'bg-[#F68B1F]',
    photography: 'bg-[#C9A86A]'
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      {event.image && (
        <div className="h-48 overflow-hidden">
          <ImageWithFallback
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-3">
          <Badge className={`${categoryColors[event.category]} text-white`}>
            {categoryLabels[event.category]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-[#424242] mb-3 leading-tight">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* University */}
        <div className="flex items-start gap-2 mb-2 text-sm">
          <Building2 className="w-4 h-4 text-[#E64626] flex-shrink-0 mt-0.5" />
          <span className="text-[#424242]">{event.university}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          {formatIcons[event.format]}
          <span className="text-gray-600">
            {event.location}, {event.country} • {event.format}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Calendar className="w-4 h-4 text-[#E64626]" />
          <span className="text-gray-600">
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Themes */}
        <div className="flex flex-wrap gap-2 mb-4">
          {event.theme.slice(0, 2).map(theme => (
            <Badge key={theme} variant="secondary" className="text-xs">
              {theme}
            </Badge>
          ))}
          {event.theme.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{event.theme.length - 2}
            </Badge>
          )}
        </div>

        {/* Prize or CTA */}
        {event.prize && (
          <div className="flex items-center gap-2 mb-4 text-sm bg-[#FFF8E7] p-2 rounded">
            <Award className="w-4 h-4 text-[#F68B1F]" />
            <span className="text-[#424242]">{event.prize}</span>
          </div>
        )}

        {/* Deadline */}
        {event.deadline && (
          <p className="text-xs text-[#E64626] mb-4">
            Deadline: {new Date(event.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}

        {/* Button */}
        <Button 
          className="w-full bg-[#E64626] hover:bg-[#F68B1F]"
          onClick={() => window.open(event.registration, '_blank')}
        >
          Learn More
        </Button>
      </div>
    </div>
  );
}
