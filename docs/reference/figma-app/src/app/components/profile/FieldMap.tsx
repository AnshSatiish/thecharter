import { useMemo, useState } from 'react';
import { geoDistance, geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { Entry, formatCoord, inkFor, stampDate } from './passportData';

const W = 960;
const H = 470;
const EARTH_KM = 6371;

/** The user's saved projects on a flat map, joined in the order they were saved (great-circle arcs from home). */
export function FieldMap({ entries, home, homeLabel, onSelect }: {
  entries: Entry[];
  home: [number, number];
  homeLabel: string;
  onSelect?: (e: Entry) => void;
}) {
  const [hover, setHover] = useState<Entry | null>(null);

  const { land, borders, projection, path } = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
    const land = feature(topo, topo.objects.land);
    const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b);
    const projection = geoEqualEarth().rotate([-150, 0]).fitExtent([[12, 12], [W - 12, H - 12]], { type: 'Sphere' });
    return { land, borders, projection, path: geoPath(projection) };
  }, []);

  const stops: [number, number][] = [home, ...entries.map((e) => [e.project.location.coordinates.lng, e.project.location.coordinates.lat] as [number, number])];
  const legs = stops.slice(1).map((to, i) => ({ from: stops[i], to }));
  const km = Math.round(legs.reduce((sum, l) => sum + geoDistance(l.from, l.to) * EARTH_KM, 0));
  const homeXY = projection(home);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Field map: ${entries.length} saved projects connected by a ${km.toLocaleString()} km route from ${homeLabel}.`}>
        <path d={path({ type: 'Sphere' }) ?? ''} fill="#e7eef0" />
        <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="#9fb5bb" strokeOpacity="0.35" strokeWidth="0.6" />
        <path d={path(land) ?? ''} fill="#efe6d2" stroke="#b9a882" strokeWidth="0.6" />
        <path d={path(borders) ?? ''} fill="none" stroke="#c9b894" strokeWidth="0.5" />

        {legs.map((l, i) => (
          <path key={i} d={path({ type: 'LineString', coordinates: [l.from, l.to] }) ?? ''} fill="none"
            stroke="#1f3b44" strokeWidth="1.8" strokeLinecap="round" pathLength={1} className="charter-route"
            style={{ animationDelay: `${i * 0.45}s` }} />
        ))}

        {homeXY && (
          <g transform={`translate(${homeXY[0]},${homeXY[1]})`}>
            <path d="M0,-9 L2.6,-2.8 9,-2.8 3.8,1.2 5.8,7.6 0,3.8 -5.8,7.6 -3.8,1.2 -9,-2.8 -2.6,-2.8Z" fill="#1f3b44" stroke="#fff" strokeWidth="1.2" />
            <text x="12" y="4" fontSize="12" fontFamily="'IBM Plex Mono', monospace" fill="#1f3b44">HOME · {homeLabel.split(',')[0].toUpperCase()}</text>
          </g>
        )}

        {entries.map((e, i) => {
          const xy = projection([e.project.location.coordinates.lng, e.project.location.coordinates.lat]);
          if (!xy) return null;
          const { ink } = inkFor(e.project.category);
          return (
            <g key={e.project.id} transform={`translate(${xy[0]},${xy[1]})`} className="cursor-pointer" tabIndex={0} role="button"
              aria-label={`${i + 1}. ${e.project.title}`}
              onMouseEnter={() => setHover(e)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(e)} onBlur={() => setHover(null)}
              onClick={() => onSelect?.(e)} onKeyDown={(k) => { if (k.key === 'Enter') onSelect?.(e); }}>
              <circle r="13" fill={ink} stroke="#fff" strokeWidth="2" />
              <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="'IBM Plex Mono', monospace">{i + 1}</text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="pointer-events-none absolute left-3 bottom-3 max-w-[300px] rounded-md bg-[#1f1d1b]/90 px-3 py-2 text-white shadow-lg">
          <p className="text-sm font-semibold leading-snug">{hover.project.title}</p>
          <p className="mt-0.5 text-[11px] text-white/75" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {formatCoord(hover.project.location.coordinates.lat, hover.project.location.coordinates.lng)} · saved {stampDate(hover.savedOn)}
          </p>
        </div>
      )}

      <FieldStats entries={entries} km={km} />
    </div>
  );
}

function FieldStats({ entries, km }: { entries: Entry[]; km: number }) {
  const countries = new Set(entries.map((e) => e.code)).size;
  const continents = new Set(entries.map((e) => e.continent)).size;
  const stats = [
    ['Entries', entries.length],
    ['Countries', countries],
    ['Continents', continents],
    ['Route length', `${km.toLocaleString()} km`],
  ] as const;
  return (
    <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-lg border border-[#d9cfbd] bg-[#d9cfbd]">
      {stats.map(([k, v]) => (
        <div key={k} className="bg-[#fbf8f1] px-4 py-3">
          <dt className="text-[10.5px] uppercase tracking-[0.14em] text-[#8a7f6f]">{k}</dt>
          <dd className="mt-0.5 text-2xl text-[#1f3b44] tabular-nums" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontVariantNumeric: 'lining-nums tabular-nums' }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
