import { useId } from 'react';
import { Entry, formatCoord, inkFor, stampDate } from './passportData';

type Shape = 'round' | 'rect' | 'oval' | 'octagon';
const SHAPES: Shape[] = ['round', 'rect', 'octagon', 'oval'];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

/** One saved project, drawn as an ink entry stamp. */
export function VisaStamp({ entry, index, onClick }: { entry: Entry; index: number; onClick?: () => void }) {
  const uid = useId().replace(/:/g, '');
  const { project, code, country, savedOn } = entry;
  const { ink, label } = inkFor(project.category);
  const shape = SHAPES[index % SHAPES.length];
  const tilt = (Math.abs(hash(project.id)) % 26) - 13;
  const coord = formatCoord(project.location.coordinates.lat, project.location.coordinates.lng);
  const top = country.toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${project.title}, saved ${stampDate(savedOn)}. Open project.`}
      className="group relative block w-full max-w-[210px] mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E64626] rounded-full"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <svg viewBox="0 0 200 150" className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.06]" style={{ mixBlendMode: 'multiply' }}>
        <defs>
          {/* Uneven ink: displaced edges plus patchy coverage */}
          <filter id={`ink-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.abs(hash(project.id)) % 50} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={index + 3} result="patch" />
            <feColorMatrix in="patch" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="mask" />
            <feComposite in="d" in2="mask" operator="in" />
          </filter>
          <path id={`arcTop-${uid}`} d="M 42 75 A 58 58 0 0 1 158 75" />
          <path id={`arcBot-${uid}`} d="M 38 75 A 62 62 0 0 0 162 75" />
        </defs>

        <g filter={`url(#ink-${uid})`} fill="none" stroke={ink} opacity="0.88">
          {shape === 'round' && (
            <>
              <circle cx="100" cy="75" r="70" strokeWidth="3.2" />
              <circle cx="100" cy="75" r="64" strokeWidth="1.2" />
              <circle cx="100" cy="75" r="40" strokeWidth="1.2" />
              <text fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="10" fontWeight="600" letterSpacing="2">
                <textPath href={`#arcTop-${uid}`} startOffset="50%" textAnchor="middle">{top.slice(0, 18)}</textPath>
              </text>
              <text fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8" letterSpacing="1.5">
                <textPath href={`#arcBot-${uid}`} startOffset="50%" textAnchor="middle">★ THE CHARTER · ENTRY ★</textPath>
              </text>
              <text x="100" y="72" textAnchor="middle" fill={ink} stroke="none" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="26">{code}</text>
              <text x="100" y="88" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8.5">{stampDate(savedOn)}</text>
            </>
          )}
          {shape === 'rect' && (
            <>
              <rect x="14" y="16" width="172" height="118" rx="10" strokeWidth="3.2" />
              <rect x="21" y="23" width="158" height="104" rx="6" strokeWidth="1.2" />
              <text x="100" y="44" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="10" fontWeight="600" letterSpacing="3">ENTRY · ADMITTED</text>
              <text x="100" y="80" textAnchor="middle" fill={ink} stroke="none" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="34">{code}</text>
              <line x1="34" y1="92" x2="166" y2="92" strokeWidth="1.2" />
              <text x="100" y="106" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="9">{stampDate(savedOn)}</text>
              <text x="100" y="119" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="7.5">{coord}</text>
            </>
          )}
          {shape === 'octagon' && (
            <>
              <polygon points="62,10 138,10 186,50 186,100 138,140 62,140 14,100 14,50" strokeWidth="3.2" />
              <polygon points="65,18 135,18 178,53 178,97 135,132 65,132 22,97 22,53" strokeWidth="1.2" />
              <text x="100" y="42" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fontWeight="600" letterSpacing="2">{top.slice(0, 20)}</text>
              <text x="100" y="80" textAnchor="middle" fill={ink} stroke="none" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="32">{code}</text>
              <text x="100" y="100" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8.5">{stampDate(savedOn)}</text>
              <text x="100" y="116" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="7" letterSpacing="1">{label.toUpperCase().slice(0, 26)}</text>
            </>
          )}
          {shape === 'oval' && (
            <>
              <ellipse cx="100" cy="75" rx="88" ry="60" strokeWidth="3.2" />
              <ellipse cx="100" cy="75" rx="81" ry="53" strokeWidth="1.2" />
              <text x="100" y="46" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fontWeight="600" letterSpacing="2">{top.slice(0, 20)}</text>
              <text x="100" y="82" textAnchor="middle" fill={ink} stroke="none" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="32">{code}</text>
              <text x="100" y="101" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8.5">{stampDate(savedOn)}</text>
              <text x="100" y="114" textAnchor="middle" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="7">{coord}</text>
            </>
          )}
        </g>
      </svg>
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 w-max max-w-[220px] rounded bg-[#1f1d1b] px-2 py-1 text-[11px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 z-10"
        style={{ transform: `translateX(-50%) rotate(${-tilt}deg)` }}>
        {project.title}
      </span>
    </button>
  );
}
