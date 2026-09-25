import { useState } from 'react';
import { X, Map, Users, Search, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="border-l-4 border-l-[#E64626] mb-6 bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-[#E64626]" />
              <h3 className="text-[#424242]" style={{ fontFamily: 'Georgia, serif' }}>Welcome to The Charter</h3>
            </div>
            <p className="text-[#424242]/80 mb-4">
              A visual platform connecting photojournalists with students, researchers, and curious minds. 
              Discover powerful photo essays from around the world, organized by themes that matter.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Map className="w-4 h-4 text-[#F68B1F] mt-0.5" />
                <div>
                  <p className="text-[#424242]">Explore the Map</p>
                  <p className="text-[#8C8279]">Browse projects by location and category</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="w-4 h-4 text-[#F68B1F] mt-0.5" />
                <div>
                  <p className="text-[#424242]">Filter & Search</p>
                  <p className="text-[#8C8279]">Find projects by keywords, dates, or themes</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-[#F68B1F] mt-0.5" />
                <div>
                  <p className="text-[#424242]">Join the Community</p>
                  <p className="text-[#8C8279]">Connect with photographers and find mentors</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
