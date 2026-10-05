import { Mail, Github, Twitter, Instagram } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="bg-[#424242] text-white mt-16 border-t-4 border-[#E64626]">
      <div className="container mx-auto px-4 py-12">
        {/* Centered Tagline */}
        <div className="text-center mb-8">
          <div className="mb-2">
            <h3 style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>THE CHARTER</h3>
            <p className="text-xs text-[#C9A86A] tracking-wide mt-1">
              MAPPING THE NEW WORLD
            </p>
          </div>
          <p className="text-sm text-white/90">
            A visual guide of culture & current global affairs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Contact */}
          <div className="text-center md:text-left">
            <p className="text-sm text-white/90">
              info@chapter.com
            </p>
          </div>

          {/* Legal */}
          <div className="text-center md:text-right">
            <button className="text-sm text-white/90 hover:text-white transition-colors">
              Terms & Conditions
            </button>
          </div>
        </div>


      </div>
    </footer>
  );
}