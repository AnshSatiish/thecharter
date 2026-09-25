import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  BookmarkIcon, 
  MessageSquare, 
  Calendar,
  ExternalLink,
  Send,
  Search,
  User,
  GraduationCap,
  Globe,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AspectRatio } from './ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Contact {
  id: string;
  name: string;
  role: string;
  university: string;
  specialty: string;
  avatar?: string;
  online: boolean;
}

interface SavedProject {
  id: string;
  title: string;
  photographer: string;
  location: string;
  date: string;
  category: string;
  thumbnail: string;
}

interface JobOpportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  deadline: string;
  description: string;
}

interface ProfilePageProps {
  onLogout?: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchContacts, setSearchContacts] = useState('');

  // Mock data - en producción esto vendría de una API
  const userProfile = {
    name: 'Diana',
    email: 'diana.martinez@university.edu',
    university: 'University of Sydney',
    degree: 'Master in Visual Anthropology',
    specialization: 'Documentary Photography & Social Research',
    location: 'Sydney, Australia',
    phone: '+61 2 1234 5678',
    bio: 'Passionate visual anthropologist focusing on urban communities and cultural preservation. Interested in collaborative documentary projects that give voice to marginalized communities.',
    interests: ['Urban Life', 'Anthropology', 'Social Justice', 'Documentary'],
    joinDate: 'September 2023',
    avatar: 'https://images.unsplash.com/photo-1724128197174-f864ac9811c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBob3RvZ3JhcGhlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NDI1ODg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  };

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Dr. Nadia Ivanova',
      role: 'Visual Culture Studies',
      university: 'UNSW Sydney',
      specialty: 'Identity, Photography',
      avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXJuJTIwZXVyb3BlYW4lMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      online: true
    },
    {
      id: '2',
      name: 'Prof. Jamal Okeke',
      role: 'Documentary Photography',
      university: 'University of Cape Town',
      specialty: 'African Visual Heritage',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwcHJvZmVzc29yfGVufDF8fHx8MTc2MzI2OTIzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      online: false
    },
    {
      id: '3',
      name: 'Dr. Lakshmi Devi',
      role: 'Indigenous Studies',
      university: 'University of Sydney',
      specialty: 'Himalayan Communities',
      avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3NvcnxlbnwxfHx8fDE3NjMyNjkyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      online: true
    },
    {
      id: '4',
      name: 'Prof. Thomas Anderson',
      role: 'Human Geography',
      university: 'ANU Canberra',
      specialty: 'Pacific Climate Migration',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzb3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjMyNjkyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      online: true
    },
    {
      id: '5',
      name: 'Dr. Fatou Diop',
      role: 'Visual Communication',
      university: 'University of Melbourne',
      specialty: 'West African Media',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwcm9mZXNzb3J8ZW58MXx8fHwxNzYzMjY5MjM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      online: false
    }
  ];

  const savedProjects: SavedProject[] = [
    {
      id: '2',
      title: 'The Last Shamans of Mongolia',
      photographer: 'David Chen',
      location: 'Mongolia',
      date: '2024-07-20',
      category: 'Anthropology',
      thumbnail: 'https://images.unsplash.com/photo-1559124136-6e1fde4ea58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNb25nb2xpYSUyMHNoYW1hbnxlbnwxfHx8fDE3NjMxNzcwNDB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: '5',
      title: 'Voices from the Margins: Syrian Refugees in Berlin',
      photographer: 'Layla Hassan',
      location: 'Germany',
      date: '2024-06-10',
      category: 'Urban Life',
      thumbnail: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCZXJsaW4lMjByZWZ1Z2VlfGVufDF8fHx8MTc2MzE3NzA0MXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: '8',
      title: 'Street Children of Kolkata',
      photographer: 'Rajesh Kumar',
      location: 'India',
      date: '2024-04-18',
      category: 'Urban Life',
      thumbnail: 'https://images.unsplash.com/photo-1520495805752-c5217c5a1da5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLb2xrYXRhJTIwY2hpbGRyZW58ZW58MXx8fHwxNzYzMTc3MDQxfDA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const jobOpportunities: JobOpportunity[] = [
    {
      id: '1',
      title: 'Documentary Photography Internship',
      organization: 'National Geographic Society',
      location: 'Remote/Washington DC',
      type: 'Internship',
      deadline: '2024-12-15',
      description: 'Join our documentary team to cover environmental and cultural stories across Southeast Asia.'
    },
    {
      id: '2',
      title: 'Visual Researcher - Indigenous Communities',
      organization: 'UNESCO',
      location: 'Paris, France',
      type: 'Full-time',
      deadline: '2024-12-30',
      description: 'Document indigenous cultural preservation projects in collaboration with local communities.'
    },
    {
      id: '3',
      title: 'Photojournalism Fellowship',
      organization: 'Magnum Foundation',
      location: 'Various Locations',
      type: 'Fellowship',
      deadline: '2025-01-10',
      description: 'One-year fellowship for emerging photographers focusing on social justice issues.'
    },
    {
      id: '4',
      title: 'Research Assistant - Urban Studies',
      organization: 'University of Sydney',
      location: 'Sydney, Australia',
      type: 'Part-time',
      deadline: '2024-12-20',
      description: 'Support visual documentation of urban transformation in Western Sydney communities.'
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchContacts.toLowerCase()) ||
    contact.specialty.toLowerCase().includes(searchContacts.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedContact) {
      // En producción, aquí enviarías el mensaje a una API
      console.log('Sending message to:', selectedContact.name, messageText);
      setMessageText('');
      // Mostrar confirmación
      alert(`Message sent to ${selectedContact.name}!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2E8] py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-32 h-32 border-4 border-[#E64626]">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="bg-[#E64626] text-white text-4xl">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl text-[#424242] mb-1">{userProfile.name}</h1>
                  <p className="text-[#F68B1F] mb-3">{userProfile.degree}</p>
                </div>
                <Button variant="outline" className="border-[#E64626] text-[#E64626] hover:bg-[#E64626] hover:text-white">
                  Edit Profile
                </Button>
              </div>

              <p className="text-gray-700 mb-4">{userProfile.bio}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">{userProfile.university}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">{userProfile.specialization}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">{userProfile.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-[#E64626]" />
                  <span className="text-sm">{userProfile.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-[#F68B1F]/10 text-[#424242]">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-md">
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacts & Messages
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Saved Projects
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Job Opportunities
            </TabsTrigger>
          </TabsList>

          {/* Contacts & Messages Tab */}
          <TabsContent value="contacts" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contacts List */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg mb-3 text-[#424242]">My Network</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchContacts}
                      onChange={(e) => setSearchContacts(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedContact?.id === contact.id
                          ? 'bg-[#E64626]/10 border-2 border-[#E64626]'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-[#C9A86A] text-white">
                              {contact.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#424242] truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.specialty}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Area */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                {selectedContact ? (
                  <div className="flex flex-col h-full">
                    {/* Contact Header */}
                    <div className="border-b pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={selectedContact.avatar} />
                          <AvatarFallback className="bg-[#C9A86A] text-white">
                            {selectedContact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg text-[#424242]">{selectedContact.name}</h3>
                          <p className="text-sm text-gray-500">{selectedContact.role} • {selectedContact.university}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4">
                      <div className="text-center text-gray-500 text-sm py-8">
                        Start a conversation with {selectedContact.name}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1 min-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-[#E64626] hover:bg-[#F68B1F] self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Select a contact to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Saved Projects Tab */}
          <TabsContent value="saved" className="mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl text-[#424242]">Saved Projects ({savedProjects.length})</h3>
                <Button variant="outline" className="border-[#E64626] text-[#E64626]">
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                    <div className="relative overflow-hidden">
                      <AspectRatio ratio={16 / 10}>
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </AspectRatio>
                      <div className="absolute top-2 right-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white"
                        >
                          <BookmarkIcon className="w-4 h-4 fill-[#E64626] text-[#E64626]" />
                        </Button>
                      </div>
                      <Badge className="absolute top-2 left-2 bg-[#E64626]">
                        {project.category}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="text-lg mb-2 text-[#424242] line-clamp-2">{project.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">by {project.photographer}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.location}
                        </span>
                        <span>{new Date(project.date).getFullYear()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Job Opportunities Tab */}
          <TabsContent value="jobs" className="mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl text-[#424242]">Saved Opportunities ({jobOpportunities.length})</h3>
                <Button variant="outline" className="border-[#E64626] text-[#E64626]">
                  Browse More
                </Button>
              </div>

              <div className="space-y-4">
                {jobOpportunities.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg text-[#424242] mb-1">{job.title}</h4>
                        <p className="text-gray-600 mb-2">{job.organization}</p>
                      </div>
                      <Badge 
                        className={
                          job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
                          job.type === 'Internship' ? 'bg-blue-100 text-blue-800' :
                          job.type === 'Fellowship' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {job.type}
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-4">{job.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <BookmarkIcon className="w-4 h-4 fill-[#E64626] text-[#E64626]" />
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-[#E64626] hover:bg-[#F68B1F]"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}