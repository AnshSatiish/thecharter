import { useEffect, useRef, useState } from 'react';
import { PhotoProject } from '../types';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WorldMapProps {
  projects: PhotoProject[];
  onProjectClick: (project: PhotoProject) => void;
  onViewGallery?: (project: PhotoProject) => void;
}

// Usando Leaflet con OpenStreetMap - NO requiere API key
export function WorldMap({ projects, onProjectClick, onViewGallery }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<PhotoProject | null>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors = {
      wildlife: '#64A70B',
      anthropology: '#C9A86A',
      urban: '#424242',
      'border-interactions': '#F68B1F',
      news: '#E64626',
    };
    return colors[category as keyof typeof colors] || '#E64626';
  };

  // Cargar Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      // Importar Leaflet
      const leaflet = await import('leaflet');
      setL(leaflet);
    };

    loadLeaflet();
  }, []);

  // Inicializar el mapa
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;

    let mapInstance: any = null;

    // Crear el mapa con validación
    try {
      mapInstance = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        preferCanvas: false,
      });

      // Añadir tiles de CartoDB Positron (sin fronteras negras)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(mapInstance);
      
      // Añadir capa de etiquetas solo (nombres de lugares en inglés)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(mapInstance);

      // Guardar referencia y marcar como listo
      mapInstanceRef.current = mapInstance;
      
      // Esperar a que el mapa esté completamente cargado
      setTimeout(() => {
        setMapReady(true);
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
      setMapReady(false);
    };
  }, [L]);

  // Crear marcadores
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !mapReady || projects.length === 0) return;

    const map = mapInstanceRef.current;

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => {
      if (marker) {
        try {
          marker.closePopup();
          marker.closeTooltip();
          map.removeLayer(marker);
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      }
    });
    markersRef.current = [];

    // Crear nuevos marcadores
    projects.forEach((project) => {
      const color = getCategoryColor(project.category);

      // Crear icono personalizado
      const customIcon = L.divIcon({
        html: `
          <div style="position: relative;">
            <svg width="32" height="42" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                    fill="${color}" 
                    stroke="#ffffff" 
                    stroke-width="2"/>
            </svg>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
      });

      // Crear marcador
      const marker = L.marker(
        [project.location.coordinates.lat, project.location.coordinates.lng],
        { icon: customIcon }
      ).addTo(map);

      // Crear tooltip con imagen (aparece en hover)
      const photographerPhoto = (project as any).photographerPhoto || '';
      const photographerProfession = (project as any).photographerProfession || '';
      const photographerWebsite = (project as any).photographerWebsite || '';
      const tooltipContent = `
        <div style="
          width: 210px;
          padding: 0;
          margin: 0;
          border-radius: 8px;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <img
            src="${project.images[0]}"
            alt="${project.title}"
            style="
              width: 100%;
              height: 110px;
              object-fit: cover;
              display: block;
            "
          />
          <div style="padding: 8px 10px 10px; background: white;">
            <div style="
              display: flex;
              align-items: center;
              gap: 7px;
              margin-bottom: 7px;
              padding-bottom: 7px;
              border-bottom: 1px solid #f0ece3;
            ">
              ${photographerPhoto ? `
                <img
                  src="${photographerPhoto}"
                  alt="${project.photographer}"
                  style="
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                    border: 1.5px solid #C9A86A;
                  "
                />
              ` : `
                <div style="
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: #C9A86A;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  font-size: 12px;
                  color: white;
                  font-weight: 600;
                ">
                  ${project.photographer.charAt(0)}
                </div>
              `}
              <div style="display: flex; flex-direction: column; gap: 1px;">
                <span style="
                  font-size: 11px;
                  color: #424242;
                  font-weight: 600;
                  line-height: 1.3;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                  white-space: normal;
                ">
                  ${project.photographer}
                </span>
                ${photographerProfession ? `
                  <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                    <span style="
                      font-size: 10px;
                      color: #C9A86A;
                      font-style: italic;
                      line-height: 1.3;
                    ">
                      ${photographerProfession}
                    </span>
                    ${photographerWebsite ? `
                      <a
                        href="${photographerWebsite}"
                        target="_blank"
                        rel="noopener noreferrer"
                        onclick="event.stopPropagation();"
                        style="
                          display: inline-block;
                          margin-left: 6px;
                          padding: 1px 6px;
                          font-size: 9px;
                          font-weight: 600;
                          color: #F68B1F;
                          background: #1a1a1a;
                          border: 1px solid #1a1a1a;
                          border-radius: 4px;
                          text-decoration: none;
                          line-height: 1.6;
                          letter-spacing: 0.02em;
                          white-space: nowrap;
                        "
                        onmouseover="this.style.background='#333';this.style.borderColor='#333';"
                        onmouseout="this.style.background='#1a1a1a';this.style.borderColor='#1a1a1a';"
                      >
                        website ↗
                      </a>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
            <p style="
              margin: 0 0 2px 0;
              font-size: 13px;
              font-weight: 600;
              color: #1f2937;
              line-height: 1.4;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
            ">
              ${project.title}
            </p>
            <p style="
              margin: 0;
              font-size: 11px;
              color: #6b7280;
            ">
              ${project.location.name}
            </p>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'auto',
        offset: [0, 10],
        className: 'custom-tooltip',
        opacity: 1,
        sticky: true,
      });

      // Crear popup
      const popupContent = `
        <div style="padding: 12px; min-width: 280px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.4; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
            ${project.title}
          </h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
            ${project.description.substring(0, 120)}${project.description.length > 120 ? '...' : ''}
          </p>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
              <span>📍</span>
              <span>${project.location.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7280;">
              <span>👤</span>
              <span>${project.photographer}</span>
              <button 
                id="view-gallery-${project.id}"
                style="
                  padding: 4px 10px;
                  background: #c6a052;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background 0.2s;
                  white-space: nowrap;
                "
                onmouseover="this.style.background='#b89048'"
                onmouseout="this.style.background='#c6a052'"
              >
                View Project →
              </button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
              <span>📅</span>
              <span>${new Date(project.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </div>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="
              display: inline-block;
              padding: 4px 12px;
              background: ${color};
              color: white;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              text-transform: capitalize;
            ">
              ${project.category}
            </span>
          </div>
          <button 
            id="view-description-${project.id}"
            style="
              width: 100%;
              padding: 10px 16px;
              background: #8b7355;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#755d47'"
            onmouseout="this.style.background='#8b7355'"
          >
            Project Description →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'custom-popup',
      });

      // Agregar eventos a los botones del popup
      marker.on('popupopen', () => {
        setSelectedProject(project);
        setTimeout(() => {
          try {
            const currentMap = mapInstanceRef.current;
            // Botón View Project (abre galería)
            const galleryButton = document.getElementById(`view-gallery-${project.id}`);
            if (galleryButton && onViewGallery) {
              galleryButton.onclick = () => {
                onViewGallery(project);
                if (currentMap) {
                  currentMap.closePopup();
                }
              };
            }
            
            // Botón Project Description (abre modal de detalles)
            const descriptionButton = document.getElementById(`view-description-${project.id}`);
            if (descriptionButton) {
              descriptionButton.onclick = () => {
                onProjectClick(project);
                if (currentMap) {
                  currentMap.closePopup();
                }
              };
            }
          } catch (error) {
            console.error('Error setting up popup buttons:', error);
          }
        }, 10);
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, L, projects, onProjectClick, onViewGallery]);

  // Manejar el cambio de tamaño del mapa cuando se activa fullscreen
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Bloquear scroll del body cuando está en fullscreen
  useEffect(() => {
    if (isFullscreen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      
      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
      
      return () => {
        // Restaurar valores originales
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        
        // Restaurar posición del scroll
        window.scrollTo(0, scrollY);
      };
    }
  }, [isFullscreen]);

  return (
    <div className="relative w-full">
      {/* Importar CSS de Leaflet */}
      <style>
        {`
          @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
          
          .custom-marker {
            background: transparent !important;
            border: none !important;
          }
          
          .custom-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          }
          
          .custom-popup .leaflet-popup-content {
            margin: 0;
            width: auto !important;
          }
          
          .custom-popup .leaflet-popup-tip {
            background: white;
          }
          
          .leaflet-container {
            font-family: system-ui, -apple-system, sans-serif;
            border-radius: 1rem;
          }
          
          .leaflet-control-zoom {
            border: 2px solid rgba(0, 0, 0, 0.1) !important;
            border-radius: 8px !important;
            overflow: hidden;
          }
          
          .leaflet-control-zoom a {
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            font-size: 20px !important;
            border: none !important;
          }
          
          .leaflet-control-zoom a:hover {
            background: #f3f4f6 !important;
          }
          
          .custom-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
            padding: 0 !important;
            border-radius: 8px !important;
            z-index: 99999 !important;
          }
          
          .custom-tooltip .leaflet-tooltip-content {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .custom-tooltip::before {
            display: none !important;
          }
          
          .leaflet-tooltip-pane {
            z-index: 99999 !important;
          }
          
          .map-wrapper {
            position: relative;
            padding-top: 150px;
            margin-top: -150px;
          }
          
          .custom-marker:hover {
            filter: brightness(1.1);
            transform: scale(1.1);
            transition: all 0.2s ease;
          }

          .fullscreen-map {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          .fullscreen-map .map-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh !important;
            width: 100vw !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
          }

          .fullscreen-map .w-full {
            width: 100vw !important;
            height: 100vh !important;
            aspect-ratio: unset !important;
            border-radius: 0 !important;
            border: none !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
          }
          
          .fullscreen-map .leaflet-container {
            border-radius: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
          }

          .fullscreen-toggle-btn {
            position: fixed !important;
            z-index: 10000 !important;
          }

          .fullscreen-toggle-btn.normal-mode {
            top: 10px;
            right: 10px;
          }

          .fullscreen-toggle-btn.fullscreen-mode {
            top: 10px;
            right: 10px;
          }
        `}
      </style>

      <div className={`map-wrapper ${isFullscreen ? 'fullscreen-map' : ''}`}>
        <div className={`w-full ${isFullscreen ? 'h-full' : 'aspect-[2/1]'} rounded-2xl border-2 border-gray-200 shadow-xl relative`}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Botón de pantalla completa - siempre visible */}
      <button
        className={`fullscreen-toggle-btn ${isFullscreen ? 'fullscreen-mode' : 'normal-mode'} bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border-2 border-gray-300/50 hover:bg-white hover:border-gray-400 transition-all`}
        onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
      >
        {isFullscreen ? <Minimize2 size={20} className="text-gray-700" /> : <Maximize2 size={20} className="text-gray-700" />}
      </button>

      {/* Project count */}
      <div className={`absolute ${isFullscreen ? 'top-4 right-20' : 'top-6 right-6'} bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg border border-gray-200 z-[1000]`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3fb57a] animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>
    </div>
  );
}