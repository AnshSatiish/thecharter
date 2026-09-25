export type Category = 'wildlife' | 'anthropology' | 'urban' | 'border-interactions' | 'news';

export type SDG = 
  | 'SDG1'  // Fin de la Pobreza
  | 'SDG2'  // Hambre Cero
  | 'SDG3'  // Salud y Bienestar
  | 'SDG4'  // Educación de Calidad
  | 'SDG5'  // Igualdad de Género
  | 'SDG6'  // Agua Limpia y Saneamiento
  | 'SDG7'  // Energía Asequible y No Contaminante
  | 'SDG8'  // Trabajo Decente y Crecimiento Económico
  | 'SDG9'  // Industria, Innovación e Infraestructura
  | 'SDG10' // Reducción de las Desigualdades
  | 'SDG11' // Ciudades y Comunidades Sostenibles
  | 'SDG12' // Producción y Consumo Responsables
  | 'SDG13' // Acción por el Clima
  | 'SDG14' // Vida Submarina
  | 'SDG15' // Vida de Ecosistemas Terrestres
  | 'SDG16' // Paz, Justicia e Instituciones Sólidas
  | 'SDG17'; // Alianzas para Lograr los Objetivos

export type Profession = 
  | 'Anthropologist' 
  | 'Geographer' 
  | 'Sociologist' 
  | 'Journalist' 
  | 'Photojournalist' 
  | 'Internationalist' 
  | 'Ethnologist' 
  | 'Biologist' 
  | 'Lawyer';

export interface ImageDetail {
  url: string;
  caption: string;
  location?: string;
  date?: string;
}

export interface ImageDescription {
  title: string;
  description: string;
}

export interface AcademicPublication {
  type: 'thesis' | 'journal' | 'newspaper';
  title: string;
  author?: string;
  journal?: string;
  newspaper?: string;
  year: number;
  url?: string;
  abstract?: string;
}

export interface PhotoProject {
  id: string;
  title: string;
  photographer: string;
  photographerWebsite: string;
  photographerGoogleScholar?: string;
  photographerResearchGate?: string;
  photographerPhoto: string;
  photographerProfession: Profession;
  photographerUniversity: string;
  category: Category;
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  date: string;
  description: string;
  longDescription?: string;
  images: string[];
  imageDetails?: ImageDetail[];
  imageDescriptions?: ImageDescription[];
  keywords: string[];
  sdgs?: SDG[];
  academicPublications?: AcademicPublication[];
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: 'photographer' | 'researcher' | 'student';
  title: string;
  content: string;
  date: string;
  replies: number;
  category: 'equipment' | 'project-inquiry' | 'mentorship' | 'general';
}

export type EventCategory = 'competitions' | 'colloquia' | 'photography';
export type EventFormat = 'presencial' | 'virtual' | 'hybrid';
export type EventTheme = 
  | 'International Relations' 
  | 'Development Studies' 
  | 'Human Rights'
  | 'Climate Change'
  | 'Migration'
  | 'Conflict Resolution'
  | 'Documentary Photography'
  | 'Photojournalism'
  | 'Visual Anthropology';

export interface AcademicEvent {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  longDescription?: string;
  university: string;
  organizer?: string;
  researcher?: string;
  format: EventFormat;
  location: string;
  country: string;
  date: string;
  deadline?: string;
  theme: EventTheme[];
  targetAudience: string[];
  language: string[];
  prize?: string;
  registration?: string;
  website?: string;
  image?: string;
}

export type JobCategory = 
  | 'journalism' 
  | 'analysis' 
  | 'media' 
  | 'business' 
  | 'cultural' 
  | 'embassy' 
  | 'international-org' 
  | 'legal' 
  | 'freelance'
  | 'public-relations'
  | 'government'
  | 'scholarships';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

export interface JobPosting {
  id: string;
  title: string;
  organization: string;
  category: JobCategory;
  type: JobType;
  location: string;
  country: string;
  remote: boolean;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  deadline: string;
  postedDate: string;
  applyUrl?: string;
  contactEmail?: string;
  image?: string;
}