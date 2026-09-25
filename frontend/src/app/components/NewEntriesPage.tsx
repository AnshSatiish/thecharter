import { PhotoProject } from '../types';
import { Calendar, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface NewEntriesPageProps {
  onProjectClick: (project: PhotoProject) => void;
  availableProject: PhotoProject;
}

export function NewEntriesPage({ onProjectClick, availableProject }: NewEntriesPageProps) {
  // Calculate next Friday
  const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday;
  };

  const nextFriday = getNextFriday();
  const december15 = new Date(2024, 11, 15); // December 15, 2024

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F2E8]">
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E64626] text-white rounded-full mb-4">
            <span className="animate-pulse">●</span>
            <span className="uppercase tracking-wider text-sm">New Entries</span>
          </div>
          <h1 className="text-[#424242] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            November 2024 Featured Projects
          </h1>
          <p className="text-[#424242] max-w-3xl mx-auto mb-8">
            Each month, The Charter selects three groundbreaking photojournalism projects 
            that exemplify academic excellence and visual storytelling. Projects are released 
            progressively throughout the month.
          </p>
        </div>

        {/* Two Column Layout: Editorial + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column - Editorial (Takes 7 columns) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-[#C9A86A] sticky top-24">
              <h2 className="text-[#424242] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Editor's Note: November 2024 Selection
              </h2>
              <div className="prose max-w-none text-[#424242] space-y-4">
                <p>
                  This November, we celebrate the intersection of cultural memory, environmental 
                  resilience, and human connection. Our curatorial team has selected three 
                  extraordinary projects that showcase how recent graduates are pushing the 
                  boundaries of visual anthropology and documentary photography.
                </p>
                <p>
                  <strong className="text-[#E64626]">Toxo'o o tsui' kiee'n: Day of the Death in the Mazatecan Highlands</strong> 
                  {' '}by Cinthia Karina Baños Paredes leads our November selection. As we approach 
                  the season when many cultures honor their deceased, this profound ethnographic 
                  documentation of Mazatec death rituals offers insights into cosmologies where 
                  death is transformation rather than ending. Baños Paredes' work demonstrates 
                  how photography can capture the ephemeral and sacred aspects of ritual 
                  performance while respecting Indigenous knowledge systems.
                </p>
                <p>
                  Our second feature examines <strong className="text-[#E64626]">coastal resilience 
                  in the face of climate change</strong>, documenting island communities adapting 
                  to rising sea levels and extreme weather events. This work connects directly to 
                  UN Sustainable Development Goals 13 and 14, illustrating how photojournalism 
                  can advance climate justice narratives.
                </p>
                <p>
                  The month concludes with a <strong className="text-[#E64626]">powerful exploration 
                  of urban food sovereignty movements</strong> in Latin American megacities, 
                  revealing how grassroots organizations are reclaiming agency over local food 
                  systems despite gentrification pressures.
                </p>
                <p className="italic border-t pt-4 mt-6 text-sm">
                  These projects were selected from over 80 submissions by our international 
                  editorial board, comprising academics from the University of Sydney, National 
                  Autonomous University of Mexico (UNAM), and the London School of Economics. 
                  Selection criteria emphasize methodological rigor, ethical engagement with 
                  communities, and contribution to scholarly discourse.
                </p>
                <p className="text-sm text-[#424242]/70">
                  <strong>Editorial Board:</strong> Dr. María Fernanda Torres (Lead Editor, University of Sydney), 
                  Dr. James Whitmore (Visual Anthropology, LSE), Dr. Ana Gabriela Ruiz (UNAM)
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Compact Projects Timeline (Takes 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Available Now - Compact */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#64A70B]">
              <div className="bg-gradient-to-r from-[#64A70B] to-[#85C01F] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <p className="text-sm">Available Now</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                    Entry #1
                  </span>
                </div>
              </div>
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onProjectClick(availableProject)}
              >
                <div className="aspect-[4/3] mb-3 overflow-hidden rounded-lg">
                  <img 
                    src={availableProject.images[0]} 
                    alt={availableProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[#424242] mb-2 line-clamp-2">
                  {availableProject.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  by {availableProject.photographer}
                </p>
                <p className="text-xs text-gray-500">
                  {availableProject.location.name}
                </p>
              </div>
            </div>

            {/* Coming Friday - Not Clickable */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#F68B1F] opacity-75">
              <div className="bg-gradient-to-r from-[#F68B1F] to-[#FFB84D] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-sm">Available {formatDate(nextFriday)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                    Entry #2
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="aspect-[4/3] mb-3 overflow-hidden rounded-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1640073686050-64b73e5e5fc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNpZmljJTIwaXNsYW5kJTIwYmVhY2glMjBjb21tdW5pdHl8ZW58MXx8fHwxNzYzMjY2NDE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Islands in Transition"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[#424242] mb-2 line-clamp-2">
                  Islands in Transition
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  by Marina Soto-Álvarez
                </p>
                <p className="text-xs text-gray-500">
                  Fiji & Tuvalu
                </p>
              </div>
            </div>

            {/* Coming December 15 - Not Clickable */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#E64626] opacity-60">
              <div className="bg-gradient-to-r from-[#E64626] to-[#FF7A5C] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-sm">Available {formatDate(december15)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                    Entry #3
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="aspect-[4/3] mb-3 overflow-hidden rounded-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1655731412959-9b573757a34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGdhcmRlbiUyMGxhdGluJTIwYW1lcmljYXxlbnwxfHx8fDE3NjMyNjY0MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Sembrando Futuro"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[#424242] mb-2 line-clamp-2">
                  Sembrando Futuro
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  by Roberto Valencia
                </p>
                <p className="text-xs text-gray-500">
                  Mexico City, São Paulo & Bogotá
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#424242] to-[#2A2A2A] rounded-2xl p-8 text-white shadow-xl">
          <div className="text-center">
            <h3 className="mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Never Miss a New Entry
            </h3>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Get notified when new projects are released. Join our community of researchers, 
              students, and visual storytelling enthusiasts.
            </p>
            <button className="px-8 py-3 bg-[#E64626] hover:bg-[#F68B1F] transition-colors rounded-lg shadow-lg">
              Subscribe to Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
