import { photoProjects } from '../../data/mockData';
import type { PhotoProject } from '../../types';

// Mock user until the backend's auth + profile endpoints exist.
export const userProfile = {
  givenNames: 'Diana',
  surname: 'Martinez',
  email: 'diana.martinez@university.edu',
  university: 'University of Sydney',
  degree: 'Master in Visual Anthropology',
  specialization: 'Documentary Photography & Social Research',
  location: 'Sydney, Australia',
  home: [151.2093, -33.8688] as [number, number], // lng, lat
  bio: 'Visual anthropologist focusing on urban communities and cultural preservation. Interested in collaborative documentary projects that give voice to marginalized communities.',
  interests: ['Urban Life', 'Anthropology', 'Social Justice', 'Documentary'],
  memberSince: '2023-09-18',
  credentialNo: 'TC2309187',
  countryCode: 'AUS',
  role: 'Student',
};

export type UserProfile = typeof userProfile;

export const CATEGORY_INK: Record<string, { ink: string; label: string }> = {
  wildlife: { ink: '#4E8A12', label: 'Wildlife & human interaction' },
  'human-wildlife': { ink: '#4E8A12', label: 'Wildlife & human interaction' },
  'wildlife-human-interaction': { ink: '#4E8A12', label: 'Wildlife & human interaction' },
  anthropology: { ink: '#9A7A3C', label: 'Anthropology' },
  urban: { ink: '#3D3D3D', label: 'Urban life' },
  'border-interactions': { ink: '#D9730D', label: 'Cross-border interactions' },
  news: { ink: '#C8351B', label: 'News' },
};
export const inkFor = (category: string) => CATEGORY_INK[category] ?? CATEGORY_INK.news;

// Each saved project is an entry stamp. savedOn orders the route on the field map.
const STAMPS: { id: string; code: string; country: string; continent: string; savedOn: string }[] = [
  { id: '17', code: 'MEX', country: 'Mexico', continent: 'North America', savedOn: '2024-11-02' },
  { id: '25', code: 'KEN', country: 'Kenya', continent: 'Africa', savedOn: '2025-01-19' },
  { id: '23', code: 'RWA', country: 'Rwanda · DR Congo', continent: 'Africa', savedOn: '2025-03-08' },
  { id: '26', code: 'MEX', country: 'Mexico · US border', continent: 'North America', savedOn: '2025-05-27' },
  { id: '28', code: 'AUS', country: 'Australia', continent: 'Oceania', savedOn: '2025-08-14' },
];

export interface Entry {
  project: PhotoProject;
  code: string;
  country: string;
  continent: string;
  savedOn: string;
}

export const entries: Entry[] = STAMPS.flatMap((s) => {
  const project = photoProjects.find((p) => p.id === s.id);
  return project ? [{ project, ...s }] : [];
}).sort((a, b) => a.savedOn.localeCompare(b.savedOn));

export const formatCoord = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** Passport-style date: 18 SEP 2023. */
export const stampDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[+m - 1]} ${y}`;
};

// ICAO 9303 check digit (weights 7-3-1), so the machine-readable zone is computed, not decorative.
export function mrzCheck(s: string) {
  const val = (c: string) => (c === '<' ? 0 : /\d/.test(c) ? +c : c.charCodeAt(0) - 55);
  return String([...s].reduce((sum, c, i) => sum + val(c) * [7, 3, 1][i % 3], 0) % 10);
}

export function mrzLines(p: UserProfile) {
  const clean = (s: string) => s.toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '<');
  const line1 = `P<TCH${clean(p.surname)}<<${clean(p.givenNames)}`.padEnd(44, '<').slice(0, 44);
  const issued = p.memberSince.slice(2).replace(/-/g, '');
  const expires = String(+p.memberSince.slice(0, 4) + 5).slice(2) + p.memberSince.slice(5).replace('-', '');
  const doc = p.credentialNo.padEnd(9, '<');
  const body = `${doc}${mrzCheck(doc)}${p.countryCode}${issued}${mrzCheck(issued)}<${expires}${mrzCheck(expires)}`;
  const line2 = (body + clean(p.degree.replace(/^Master in /, ''))).padEnd(43, '<').slice(0, 43);
  return [line1, line2 + mrzCheck(line2)];
}
