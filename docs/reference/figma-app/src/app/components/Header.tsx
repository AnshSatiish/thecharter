import { useState } from 'react';
import { Search, Menu, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onNavigate: (section: 'map' | 'community' | 'projects' | 'newentries' | 'partners' | 'events' | 'profile') => void;
  currentSection: 'map' | 'community' | 'projects' | 'newentries' | 'partners' | 'events' | 'profile';
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function Header({ onSearchChange, onNavigate, currentSection, isAuthenticated = false, userName = '', onLogout }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (section: 'map' | 'community' | 'projects' | 'newentries' | 'partners' | 'events' | 'profile') => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-[#424242] text-white sticky top-0 z-[200] shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-white tracking-wider" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>THE CHARTER</h1>
              <p className="text-xs text-[#F68B1F] tracking-wide">MAPPING THE NEW WORLD</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm ${
                currentSection === 'map' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('map')}
            >
              Map
            </button>
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm ${
                currentSection === 'projects' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('projects')}
            >
              Projects
            </button>
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm ${
                currentSection === 'community' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('community')}
            >
              Community
            </button>
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm flex flex-col items-center leading-tight ${
                currentSection === 'newentries' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('newentries')}
            >
              <span>New</span>
              <span>Entries</span>
            </button>
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm ${
                currentSection === 'partners' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('partners')}
            >
              Sponsors
            </button>
            <button
              className={`px-4 py-2 transition-colors uppercase tracking-wider text-sm ${
                currentSection === 'events' 
                  ? 'text-white border-b-2 border-[#E64626]' 
                  : 'text-[#C9A86A] hover:text-white'
              }`}
              onClick={() => onNavigate('events')}
            >
              Events
            </button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Button
                    variant={currentSection === 'map' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('map')}
                    className="w-full justify-start"
                  >
                    Explore Map
                  </Button>
                  <Button
                    variant={currentSection === 'projects' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('projects')}
                    className="w-full justify-start"
                  >
                    All Projects
                  </Button>
                  <Button
                    variant={currentSection === 'community' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('community')}
                    className="w-full justify-start"
                  >
                    Community
                  </Button>
                  <Button
                    variant={currentSection === 'newentries' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('newentries')}
                    className="w-full justify-start"
                  >
                    New Entries
                  </Button>
                  <Button
                    variant={currentSection === 'partners' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('partners')}
                    className="w-full justify-start"
                  >
                    Sponsors
                  </Button>
                  <Button
                    variant={currentSection === 'events' ? 'default' : 'ghost'}
                    onClick={() => handleNavigate('events')}
                    className="w-full justify-start"
                  >
                    Events
                  </Button>
                  <div className="border-t pt-4 mt-4">
                    {isAuthenticated ? (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout?.();
                          toast.info('Logged Out', {
                            description: 'You have been successfully logged out!'
                          });
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          toast.info('Sign In', {
                            description: 'Connect with your photographer profile or create a student account!'
                          });
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Sign In / Register
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            {isAuthenticated ? (
              <button 
                className="px-6 py-2 bg-[#E64626] text-white rounded hover:bg-[#F68B1F] transition-colors uppercase tracking-wide text-sm shadow-md whitespace-nowrap"
                onClick={() => {
                  onNavigate('profile');
                }}
              >
                {userName || 'DIANA'}
              </button>
            ) : (
              <button 
                className="px-6 py-2 bg-[#E64626] text-white rounded hover:bg-[#F68B1F] transition-colors uppercase tracking-wide text-sm shadow-md whitespace-nowrap"
                onClick={() => {
                  toast.info('Sign In', {
                    description: 'Connect with your photographer profile or create a student account to access more features!'
                  });
                }}
              >
                Log In
              </button>
            )}
          </div>
        </div>


      </div>
    </header>
  );
}