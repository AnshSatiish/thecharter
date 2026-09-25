import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Tag, 
  Globe, 
  Layers,
  RotateCcw
} from 'lucide-react';
import { Category, SDG } from '../types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface ProjectsFilterSidebarProps {
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
  { id: 'all' as const, label: 'All Projects', color: '#E64626' },
  { id: 'wildlife' as const, label: 'Wildlife-Human Interaction', color: '#56C02B' },
  { id: 'anthropology' as const, label: 'Anthropology', color: '#C9A86A' },
  { id: 'urban' as const, label: 'Urban Life', color: '#424242' },
  { id: 'border-interactions' as const, label: 'Border Interactions', color: '#26BDE2' },
  { id: 'news' as const, label: 'News', color: '#F68B1F' },
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

export function ProjectsFilterSidebar({
  selectedCategory,
  onCategoryChange,
  onYearRangeChange,
  yearRange,
  selectedKeywords,
  onKeywordsChange,
  availableKeywords,
  selectedSDG,
  onSDGChange,
}: ProjectsFilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [keywordSearch, setKeywordSearch] = useState('');

  const handleStartYearChange = (value: string) => {
    if (value === '' || /^\d{0,4}$/.test(value)) {
      onYearRangeChange(value, yearRange.end);
    }
  };

  const handleEndYearChange = (value: string) => {
    if (value === '' || /^\d{0,4}$/.test(value)) {
      onYearRangeChange(yearRange.start, value);
    }
  };

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      onKeywordsChange(selectedKeywords.filter(k => k !== keyword));
    } else {
      onKeywordsChange([...selectedKeywords, keyword]);
    }
  };

  const clearAllFilters = () => {
    onCategoryChange('all');
    onYearRangeChange('', '');
    onKeywordsChange([]);
    onSDGChange([]);
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    yearRange.start !== '' || 
    yearRange.end !== '' || 
    selectedKeywords.length > 0 || 
    selectedSDG.length > 0;

  const filteredKeywords = availableKeywords.filter(keyword =>
    keyword.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-[#E64626] hover:bg-[#C13A1F]"
        size="icon"
      >
        <Filter className="w-6 h-6" />
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-[#E8E5DC] shadow-lg z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-80 overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E5DC] p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#E64626]" />
              <h3 className="text-[#424242]">Filters</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>

        {/* Filter Sections */}
        <div className="p-4">
          <Accordion type="multiple" defaultValue={['category', 'year', 'keywords', 'sdg']} className="space-y-4">
            {/* Category Filter */}
            <AccordionItem value="category" className="border border-[#E8E5DC] rounded-lg px-4 bg-[#F5F2E8]">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">Area of Study</span>
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="ml-2 bg-[#E64626] text-white">
                      1
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryChange(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-3 ${
                        selectedCategory === cat.id
                          ? 'bg-[#E64626] text-white shadow-md'
                          : 'bg-white hover:bg-gray-50 text-[#424242]'
                      }`}
                    >
                      <span className="text-sm flex-1">{cat.label}</span>
                      {selectedCategory === cat.id && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Year Range Filter */}
            <AccordionItem value="year" className="border border-[#E8E5DC] rounded-lg px-4 bg-[#F5F2E8]">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">Year Range</span>
                  {(yearRange.start || yearRange.end) && (
                    <Badge variant="secondary" className="ml-2 bg-[#E64626] text-white">
                      Active
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-[#424242] mb-1 block">From:</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="1989"
                      value={yearRange.start}
                      onChange={(e) => handleStartYearChange(e.target.value)}
                      className="w-full"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#424242] mb-1 block">To:</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="2024"
                      value={yearRange.end}
                      onChange={(e) => handleEndYearChange(e.target.value)}
                      className="w-full"
                      maxLength={4}
                    />
                  </div>
                  {(yearRange.start || yearRange.end) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onYearRangeChange('', '')}
                      className="w-full"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Keywords Filter */}
            <AccordionItem value="keywords" className="border border-[#E8E5DC] rounded-lg px-4 bg-[#F5F2E8]">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">Keywords</span>
                  {selectedKeywords.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-[#E64626] text-white">
                      {selectedKeywords.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <Input
                    type="text"
                    placeholder="Search keywords..."
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    className="w-full"
                  />
                  
                  {/* Selected Keywords */}
                  {selectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
                      {selectedKeywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-400 bg-[#E64626] text-white"
                          onClick={() => toggleKeyword(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Available Keywords */}
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredKeywords.slice(0, 20).map((keyword) => {
                      const isSelected = selectedKeywords.includes(keyword);
                      return (
                        <div
                          key={keyword}
                          className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer"
                          onClick={() => toggleKeyword(keyword)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleKeyword(keyword)}
                          />
                          <span className="text-sm text-[#424242]">{keyword}</span>
                        </div>
                      );
                    })}
                    {filteredKeywords.length > 20 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        +{filteredKeywords.length - 20} more keywords...
                      </p>
                    )}
                  </div>

                  {selectedKeywords.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onKeywordsChange([])}
                      className="w-full"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SDG Filter */}
            <AccordionItem value="sdg" className="border border-[#E8E5DC] rounded-lg px-4 bg-[#F5F2E8]">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">UN SDGs</span>
                  {selectedSDG.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-[#E64626] text-white">
                      {selectedSDG.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 max-h-96 overflow-y-auto">
                  {sdgList.map((sdg) => {
                    const isSelected = selectedSDG.includes(sdg.id);
                    return (
                      <button
                        key={sdg.id}
                        onClick={() => onSDGChange(isSelected ? selectedSDG.filter(s => s !== sdg.id) : [...selectedSDG, sdg.id])}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-white shadow-md border-2 border-gray-300'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: sdg.color }}
                        >
                          <span className="text-xs">{sdg.number}</span>
                        </div>
                        <span className="text-xs flex-1">{sdg.label}</span>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#E64626]"></div>
                        )}
                      </button>
                    );
                  })}
                  {selectedSDG.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSDGChange([])}
                      className="w-full mt-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="sticky bottom-0 bg-white border-t border-[#E8E5DC] p-4">
            <p className="text-xs text-[#424242] mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== 'all' && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-gray-100"
                  onClick={() => onCategoryChange('all')}
                >
                  {categories.find(c => c.id === selectedCategory)?.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {(yearRange.start || yearRange.end) && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-gray-100"
                  onClick={() => onYearRangeChange('', '')}
                >
                  {yearRange.start || '...'} - {yearRange.end || '...'}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {/* Show each SDG with individual X button */}
              {selectedSDG.map((sdgId) => {
                const sdg = sdgList.find(s => s.id === sdgId);
                return sdg ? (
                  <Badge 
                    key={sdgId}
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-gray-100 flex items-center gap-1"
                    style={{ borderColor: sdg.color, color: sdg.color }}
                    onClick={() => onSDGChange(selectedSDG.filter(id => id !== sdgId))}
                  >
                    <span>SDG {sdg.number}</span>
                    <X className="w-3 h-3" />
                  </Badge>
                ) : null;
              })}
              {selectedKeywords.length > 0 && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-gray-100"
                  onClick={() => onKeywordsChange([])}
                >
                  {selectedKeywords.length} keyword{selectedKeywords.length !== 1 ? 's' : ''}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}