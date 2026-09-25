import { Award, Star, TrendingUp, Building2 } from 'lucide-react';

interface PlatinumSponsor {
  name: string;
  image: string;
  description: string;
}

const platinumSponsors: PlatinumSponsor[] = [
  {
    name: 'Canon',
    image: '/src/imports/download.png',
    description: 'Official Imaging Partner'
  },
  {
    name: 'Royal Ontario Museum',
    image: '/src/imports/download-1.png',
    description: 'Cultural Heritage Partner'
  },
  {
    name: 'BMO Bank of Montreal',
    image: '/src/imports/download.jpg',
    description: 'Financial Innovation Partner'
  },
  {
    name: 'Toronto Metropolitan University',
    image: 'https://images.unsplash.com/photo-1643434558515-20e3a2371c37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb3JvbnRvJTIwTWV0cm9wb2xpdGFuJTIwVW5pdmVyc2l0eSUyMGNhbXB1c3xlbnwxfHx8fDE3NjY4ODU4MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Academic Partner'
  },
  {
    name: 'University of Melbourne',
    image: 'https://images.unsplash.com/photo-1633296452834-0669c7669a34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVbml2ZXJzaXR5JTIwTWVsYm91cm5lJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzY2ODg2MjExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Research Excellence Partner'
  },
  {
    name: 'Global Affairs Canada',
    image: 'https://images.unsplash.com/photo-1759378206456-40dc2847b203?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDYW5hZGElMjBwYXJsaWFtZW50JTIwZ292ZXJubWVudHxlbnwxfHx8fDE3NjY4ODYyMTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'International Development Partner'
  },
  {
    name: 'Toronto District School Board',
    image: 'https://images.unsplash.com/photo-1650172101138-c0bb7bc32ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb3JvbnRvJTIwc2Nob29sJTIwZWR1Y2F0aW9ufGVufDF8fHx8MTc2Njg4NjIxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Education Partner'
  }
];

const goldSponsors: string[] = [
  'Nikon Professional Services',
  'Sony Alpha Collective',
  'National Geographic Society',
  'Getty Images Foundation',
  'Magnum Photos',
  'Reuters Foundation',
  'The Pulitzer Center',
  'World Press Photo Foundation',
  'International Center of Photography',
  'Aperture Foundation'
];

const silverSponsors: string[] = [
  'Leica Camera AG',
  'Adobe Creative Cloud',
  'Fujifilm Global',
  'Phase One',
  'Profoto',
  'Capture One',
  'The Guardian Foundation',
  'Time Magazine',
  'VII Foundation',
  'Contact Press Images',
  'Panos Pictures',
  'Redux Pictures'
];

const bronzeSponsors: string[] = [
  'DJI Enterprise',
  'Epson Professional Imaging',
  'Wacom Technology',
  'Manfrotto',
  'Peak Design',
  'Think Tank Photo',
  'Lowepro',
  'SanDisk Professional',
  'Calibrite',
  'Datacolor',
  'X-Rite',
  'Eizo',
  'BenQ',
  'LaCie',
  'Pelican Products',
  'Storm Cases'
];

export function Partners() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#424242] to-[#2a2a2a]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-[#C9A86A] mb-4 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
            OUR SPONSORS
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            The Charter is made possible through the generous support of organizations committed to advancing 
            visual storytelling, photojournalism excellence, and global documentary research.
          </p>
        </div>

        {/* Platinum Sponsors */}
        <div className="mb-20">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Award className="w-8 h-8 text-[#E5E4E2]" />
            <h2 className="text-[#E5E4E2] tracking-wide text-center" style={{ fontFamily: 'Georgia, serif' }}>
              PLATINUM SPONSORS
            </h2>
            <Award className="w-8 h-8 text-[#E5E4E2]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {platinumSponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border-2 border-[#E5E4E2]/30 rounded-xl overflow-hidden hover:border-[#E64626]/60 hover:shadow-2xl hover:shadow-[#E64626]/20 transition-all duration-300 group"
              >
                {/* Sponsor Image */}
                <div className="h-56 overflow-hidden relative bg-white flex items-center justify-center p-6">
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 w-12 h-12 bg-[#E5E4E2] rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-[#424242]" />
                  </div>
                </div>
                
                {/* Sponsor Info */}
                <div className="p-6">
                  <h3 className="text-white mb-2 text-center leading-tight">
                    {sponsor.name}
                  </h3>
                  <p className="text-[#C9A86A] text-sm text-center italic">
                    {sponsor.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gold Sponsors */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-10">
            <Star className="w-7 h-7 text-[#FFD700]" />
            <h2 className="text-[#FFD700] tracking-wide text-center" style={{ fontFamily: 'Georgia, serif' }}>
              GOLD SPONSORS
            </h2>
            <Star className="w-7 h-7 text-[#FFD700]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {goldSponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 backdrop-blur-sm border border-[#FFD700]/40 rounded-lg p-8 hover:border-[#FFD700]/70 hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all duration-300 group"
              >
                <h3 className="text-white text-center leading-tight">
                  {sponsor}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Silver Sponsors */}
        <div className="mb-14">
          <div className="flex items-center justify-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-[#C0C0C0]" />
            <h3 className="text-[#C0C0C0] tracking-wide text-center" style={{ fontFamily: 'Georgia, serif' }}>
              SILVER SPONSORS
            </h3>
            <TrendingUp className="w-6 h-6 text-[#C0C0C0]" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {silverSponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-[#C0C0C0]/30 rounded-lg p-6 hover:border-[#C0C0C0]/60 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <p className="text-[#C0C0C0] leading-tight">
                  {sponsor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bronze Sponsors */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-[#CD7F32]" />
            <h4 className="text-[#CD7F32] tracking-wide text-center" style={{ fontFamily: 'Georgia, serif' }}>
              BRONZE SPONSORS
            </h4>
            <Building2 className="w-5 h-5 text-[#CD7F32]" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {bronzeSponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-[#CD7F32]/20 rounded-md p-4 hover:border-[#CD7F32]/40 hover:bg-white/10 transition-all duration-300 text-center"
              >
                <p className="text-[#CD7F32] text-sm leading-tight">
                  {sponsor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="bg-white/5 border border-[#C9A86A]/30 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-[#F68B1F] mb-4 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Become a Sponsor
            </h3>
            <p className="text-gray-300 mb-6">
              Organizations interested in supporting emerging photojournalists and visual storytellers can explore 
              sponsorship opportunities across our four partnership tiers. Your support directly enables students 
              and early-career researchers to document critical global issues.
            </p>
            <button className="px-8 py-3 bg-[#E64626] text-white rounded hover:bg-[#F68B1F] transition-colors uppercase tracking-wide text-sm shadow-lg">
              Sponsorship Opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}