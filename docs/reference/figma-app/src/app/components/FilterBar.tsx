import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Tag, Globe, Search, Check, X } from 'lucide-react';
import { Category, SDG } from '../types';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import torontoLogo from 'figma:asset/e79ffe95314ee53156570ca91bb89909ccd639e4.jpg';

interface FilterBarProps {
  selectedCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  onYearRangeChange: (startYear: string, endYear: string) => void;
  yearRange: { start: string; end: string };
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  availableKeywords: string[];
  selectedSDG: SDG[]; // Changed from SDG | null to SDG[]
  onSDGChange: (sdg: SDG[]) => void; // Changed from (sdg: SDG | null) to (sdg: SDG[])
}

const categories = [
  { id: 'all' as const, label: 'All Projects', description: 'View all', color: '#E64626' },
  { id: 'wildlife' as const, label: 'Wildlife-Human Interaction', description: 'Global warming & ecology', color: '#64A70B' },
  { id: 'anthropology' as const, label: 'Anthropology', description: 'Traditions & cosmovisions', color: '#C9A86A' },
  { id: 'urban' as const, label: 'Urban Life', description: 'Neighborhoods & sociology', color: '#424242' },
  { id: 'border-interactions' as const, label: 'Border Interactions', description: 'Cross-border dynamics', color: '#F68B1F' },
  { id: 'news' as const, label: 'News', description: 'Current events', color: '#E64626' },
];

const sdgList = [
  { id: 'SDG1' as const, number: 1, label: 'No Poverty', color: '#E5243B' },
  { id: 'SDG2' as const, number: 2, label: 'Zero Hunger', color: '#DDA63A' },
  { id: 'SDG3' as const, number: 3, label: 'Good Health and Well-being', color: '#4C9F38' },
  { id: 'SDG4' as const, number: 4, label: 'Quality Education', color: '#C5192D' },
  { id: 'SDG5' as const, number: 5, label: 'Gender Equality', color: '#FF3A21' },
  { id: 'SDG6' as const, number: 6, label: 'Clean Water and Sanitation', color: '#26BDE2' },
  { id: 'SDG7' as const, number: 7, label: 'Affordable and Clean Energy', color: '#FCC30B' },
  { id: 'SDG8' as const, number: 8, label: 'Decent Work and Economic Growth', color: '#A21942' },
  { id: 'SDG9' as const, number: 9, label: 'Industry, Innovation and Infrastructure', color: '#FD6925' },
  { id: 'SDG10' as const, number: 10, label: 'Reduced Inequalities', color: '#DD1367' },
  { id: 'SDG11' as const, number: 11, label: 'Sustainable Cities and Communities', color: '#FD9D24' },
  { id: 'SDG12' as const, number: 12, label: 'Responsible Consumption and Production', color: '#BF8B2E' },
  { id: 'SDG13' as const, number: 13, label: 'Climate Action', color: '#3F7E44' },
  { id: 'SDG14' as const, number: 14, label: 'Life Below Water', color: '#0A97D9' },
  { id: 'SDG15' as const, number: 15, label: 'Life on Land', color: '#56C02B' },
  { id: 'SDG16' as const, number: 16, label: 'Peace, Justice and Strong Institutions', color: '#00689D' },
  { id: 'SDG17' as const, number: 17, label: 'Partnerships for the Goals', color: '#19486A' },
];

export function FilterBar({ 
  selectedCategory, 
  onCategoryChange, 
  onYearRangeChange, 
  yearRange,
  selectedKeywords,
  onKeywordsChange,
  availableKeywords,
  selectedSDG,
  onSDGChange
}: FilterBarProps) {
  const handleStartYearChange = (value: string) => {
    // Only allow 4 digits
    if (value === '' || (/^\d{0,4}$/.test(value))) {
      onYearRangeChange(value, yearRange.end);
    }
  };

  const handleEndYearChange = (value: string) => {
    // Only allow 4 digits
    if (value === '' || (/^\d{0,4}$/.test(value))) {
      onYearRangeChange(yearRange.start, value);
    }
  };

  const clearYearRange = () => {
    onYearRangeChange('', '');
  };

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      onKeywordsChange(selectedKeywords.filter(k => k !== keyword));
    } else {
      onKeywordsChange([...selectedKeywords, keyword]);
    }
  };

  const hasYearFilter = yearRange.start !== '' || yearRange.end !== '';
  const hasKeywordFilter = selectedKeywords.length > 0;
  const hasSDGFilter = selectedSDG.length > 0;
  
  const [isSDGPopoverOpen, setIsSDGPopoverOpen] = useState(false);
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);
  const [isKeywordPopoverOpen, setIsKeywordPopoverOpen] = useState(false);
  
  // Keyword search state
  const [keywordSearch, setKeywordSearch] = useState('');
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const keywordInputRef = useRef<HTMLInputElement>(null);
  
  // Filter keywords based on search
  const filteredKeywords = availableKeywords.filter(keyword => 
    keyword.toLowerCase().includes(keywordSearch.toLowerCase())
  );
  
  const exactMatch = availableKeywords.find(
    keyword => keyword.toLowerCase() === keywordSearch.toLowerCase()
  );
  
  const hasMatches = filteredKeywords.length > 0;
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (keywordInputRef.current && !keywordInputRef.current.contains(event.target as Node)) {
        setShowKeywordSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const addKeyword = (keyword: string) => {
    if (!selectedKeywords.includes(keyword)) {
      onKeywordsChange([...selectedKeywords, keyword]);
    }
    setKeywordSearch('');
    setShowKeywordSuggestions(false);
  };

  return (
    <div className="bg-white border-b border-[#E8E5DC] shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Category Filters */}
          <div>
            <p className="text-sm text-[#424242] mb-3 text-center">Filter by area of study:</p>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`flex flex-col items-start h-auto py-2 px-4 rounded transition-colors relative ${
                      selectedCategory === cat.id
                        ? 'bg-[#E64626] text-white shadow-md'
                        : 'bg-white text-[#424242] hover:bg-[#F5F2E8] border border-[#E8E5DC]'
                    }`}
                    style={{
                      borderBottom: `3px solid ${cat.color}`
                    }}
                  >
                    <span className="text-sm">{cat.label}</span>
                    <span className="text-xs opacity-80">{cat.description}</span>
                  </button>
                ))}
              </div>
              
              {/* Sponsor Section */}
              <div className="flex flex-col items-center gap-1 px-4 py-2 bg-white border border-[#E8E5DC] rounded">
                <p className="text-xs text-[#424242] opacity-70">Sponsored by</p>
                <img 
                  src={torontoLogo} 
                  alt="University of Toronto Libraries" 
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* ODS, Year Range and Keywords Filters */}
          <div className="flex items-center gap-0 flex-wrap">
            {/* ODS Filter */}
            <div className="flex items-center gap-2 pr-4 border-r-2 border-[#E8E5DC] relative z-40">
              <Globe className="w-4 h-4 text-[#E64626]" />
              <span className="text-sm text-[#424242]">ONU ODS:</span>
              <Popover open={isSDGPopoverOpen} onOpenChange={setIsSDGPopoverOpen}>
                <PopoverTrigger asChild>
                  <div
                    className="relative z-40"
                    onMouseEnter={() => {
                      setIsSDGPopoverOpen(true);
                    }}
                    onMouseLeave={() => {
                      setIsSDGPopoverOpen(false);
                    }}
                    onClick={() => {
                      setIsSDGPopoverOpen(!isSDGPopoverOpen);
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={`px-4 py-3 relative z-40 pointer-events-auto ${
                        hasSDGFilter 
                          ? 'bg-[#E64626] text-white hover:bg-[#C13A1F] hover:text-white border-[#E64626]' 
                          : 'hover:bg-[#F5F2E8]'
                      }`}
                    >
                      {hasSDGFilter 
                        ? `SDG ${sdgList.find(s => s.id === selectedSDG[0])?.number}` 
                        : 'Select SDG'}
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-4 z-40" 
                  align="start"
                  onMouseEnter={() => {
                    setIsSDGPopoverOpen(true);
                  }}
                  onMouseLeave={() => {
                    setIsSDGPopoverOpen(false);
                  }}
                >
                  <div className="space-y-2">
                    <p className="text-sm mb-3">Objetivos de Desarrollo Sostenible de la ONU:</p>
                    <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                      {sdgList.map((sdg) => (
                        <button
                          key={sdg.id}
                          onClick={() => {
                            onSDGChange(selectedSDG.includes(sdg.id) ? selectedSDG.filter(id => id !== sdg.id) : [...selectedSDG, sdg.id]);
                            setIsSDGPopoverOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                            selectedSDG.includes(sdg.id)
                              ? 'bg-gray-100 border-2 border-gray-400'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: sdg.color }}
                          >
                            <span className="text-xs">{sdg.number}</span>
                          </div>
                          <span className="text-sm">{sdg.label}</span>
                        </button>
                      ))}
                    </div>
                    {hasSDGFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSDGChange([]);
                          setIsSDGPopoverOpen(false);
                        }}
                        className="w-full mt-2"
                      >
                        Limpiar filtro
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Year Range Filter */}
            <div className="flex items-center gap-2 px-4 border-r-2 border-[#E8E5DC] relative z-30">
              <Calendar className="w-4 h-4 text-[#E64626]" />
              <span className="text-sm text-[#424242]">By year:</span>
              <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
                <PopoverTrigger asChild>
                  <div
                    className="relative z-30"
                    onMouseEnter={() => setIsYearPopoverOpen(true)}
                    onMouseLeave={() => setIsYearPopoverOpen(false)}
                    onClick={() => setIsYearPopoverOpen(!isYearPopoverOpen)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={`px-4 py-3 relative z-30 pointer-events-auto ${
                        hasYearFilter 
                          ? 'bg-[#E64626] text-white hover:bg-[#C13A1F] hover:text-white border-[#E64626]' 
                          : 'hover:bg-[#F5F2E8]'
                      }`}
                    >
                      {hasYearFilter 
                        ? `${yearRange.start || '...'} — ${yearRange.end || '...'}` 
                        : 'Select Years'}
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-4 z-30" 
                  align="start"
                  onMouseEnter={() => setIsYearPopoverOpen(true)}
                  onMouseLeave={() => setIsYearPopoverOpen(false)}
                >
                  <div className="space-y-3">
                    <p className="text-sm mb-2">Select year range:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">From:</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="1989"
                          value={yearRange.start}
                          onChange={(e) => handleStartYearChange(e.target.value)}
                          className="w-full text-center"
                          maxLength={4}
                        />
                      </div>
                      <span className="text-gray-500 mt-5">—</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">To:</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="2024"
                          value={yearRange.end}
                          onChange={(e) => handleEndYearChange(e.target.value)}
                          className="w-full text-center"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    {hasYearFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clearYearRange();
                          setIsYearPopoverOpen(false);
                        }}
                        className="w-full"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Keywords Filter */}
            <div className="flex items-center gap-2 pl-4 relative z-20">
              <Tag className="w-4 h-4 text-[#E64626]" />
              <span className="text-sm text-[#424242]">By keywords:</span>
              <Popover open={isKeywordPopoverOpen} onOpenChange={setIsKeywordPopoverOpen}>
                <PopoverTrigger asChild>
                  <div
                    className="relative z-20"
                    onMouseEnter={() => setIsKeywordPopoverOpen(true)}
                    onMouseLeave={() => setIsKeywordPopoverOpen(false)}
                    onClick={() => setIsKeywordPopoverOpen(!isKeywordPopoverOpen)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={`px-4 py-3 relative z-20 pointer-events-auto ${
                        hasKeywordFilter 
                          ? 'bg-[#E64626] text-white hover:bg-[#C13A1F] hover:text-white border-[#E64626]' 
                          : 'hover:bg-[#F5F2E8]'
                      }`}
                    >
                      {hasKeywordFilter 
                        ? `${selectedKeywords.length} keyword${selectedKeywords.length !== 1 ? 's' : ''}` 
                        : 'Search keywords'}
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-96 p-4 z-20" 
                  align="start"
                  onMouseEnter={() => setIsKeywordPopoverOpen(true)}
                  onMouseLeave={() => setIsKeywordPopoverOpen(false)}
                >
                  <div className="space-y-3" ref={keywordInputRef}>
                    <p className="text-sm mb-2">Search and select keywords:</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Type to search..."
                        value={keywordSearch}
                        onChange={(e) => {
                          setKeywordSearch(e.target.value);
                          setShowKeywordSuggestions(true);
                        }}
                        onFocus={() => setShowKeywordSuggestions(true)}
                        className="pl-10 pr-10"
                      />
                      {keywordSearch && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {exactMatch ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : hasMatches ? (
                            <span className="text-xs text-[#F68B1F]">{filteredKeywords.length}</span>
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Keywords Display */}
                    {selectedKeywords.length > 0 && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-500 mb-2">Selected keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedKeywords.map((keyword) => (
                            <Badge 
                              key={keyword} 
                              variant="secondary"
                              className="bg-[#E64626] text-white cursor-pointer hover:bg-[#C13A1F]"
                              onClick={() => toggleKeyword(keyword)}
                            >
                              {keyword}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                
                    {/* Suggestions Dropdown */}
                    {showKeywordSuggestions && keywordSearch && (
                      <div className="border-t mt-2 pt-2 max-h-64 overflow-y-auto">
                        {hasMatches ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 px-2 py-1">
                              {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? 's' : ''} found
                            </div>
                            {filteredKeywords.map((keyword) => {
                              const isSelected = selectedKeywords.includes(keyword);
                              const isExact = keyword.toLowerCase() === keywordSearch.toLowerCase();
                              return (
                                <button
                                  key={keyword}
                                  onClick={() => addKeyword(keyword)}
                                  disabled={isSelected}
                                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between group ${
                                    isSelected 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'hover:bg-[#F5F2E8] text-gray-700'
                                  } ${isExact ? 'bg-green-50 border-l-2 border-green-500' : ''}`}
                                >
                                  <span className="flex-1">
                                    {keyword}
                                    {isExact && <span className="ml-2 text-xs text-green-600">(exact match)</span>}
                                  </span>
                                  {isSelected ? (
                                    <Check className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <Tag className="w-4 h-4 text-[#E64626] opacity-0 group-hover:opacity-100" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-1">No keywords found</p>
                            <p className="text-xs text-gray-500">
                              "{keywordSearch}" does not exist in any project
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {hasKeywordFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onKeywordsChange([]);
                          setIsKeywordPopoverOpen(false);
                        }}
                        className="w-full mt-2"
                      >
                        Clear All Keywords
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selected Keywords */}
          {hasKeywordFilter && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#424242]">Selected keywords:</span>
              {selectedKeywords.map((keyword) => (
                <Badge 
                  key={keyword} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-400"
                  onClick={() => toggleKeyword(keyword)}
                >
                  {keyword} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory !== 'all' || hasYearFilter || hasSDGFilter) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#424242]">Active filters:</span>
              {selectedCategory !== 'all' && (
                <Badge variant="secondary">
                  {categories.find(c => c.id === selectedCategory)?.label}
                </Badge>
              )}
              {/* Show each SDG with individual X button */}
              {selectedSDG.map((sdgId) => {
                const sdg = sdgList.find(s => s.id === sdgId);
                return sdg ? (
                  <Badge 
                    key={sdgId}
                    variant="secondary"
                    style={{ backgroundColor: sdg.color, color: 'white' }}
                    className="cursor-pointer hover:opacity-80 flex items-center gap-1"
                    onClick={() => onSDGChange(selectedSDG.filter(id => id !== sdgId))}
                  >
                    <span>ODS {sdg.number}: {sdg.label}</span>
                    <X className="w-3 h-3" />
                  </Badge>
                ) : null;
              })}
              {hasYearFilter && (
                <Badge variant="secondary">
                  Years: {yearRange.start || '...'} - {yearRange.end || '...'}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}