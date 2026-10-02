import { useState, type ReactNode } from 'react';
import {
  MapPin,
  Briefcase,
  BookmarkIcon,
  MessageSquare,
  Calendar,
  ExternalLink,
  Send,
  Search,
  LogOut,
  PenLine,
  BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AspectRatio } from './ui/aspect-ratio';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import type { PhotoProject } from '../types';
import { photoProjects } from '../data/mockData';
import { entries, inkFor, mrzLines, stampDate, userProfile, UserProfile } from './profile/passportData';
import { VisaStamp } from './profile/VisaStamp';
import { FieldMap } from './profile/FieldMap';

interface Contact {
  id: string;
  name: string;
  role: string;
  university: string;
  specialty: string;
  online: boolean;
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

interface Message {
  text: string;
  at: string;
}

interface ProfilePageProps {
  onLogout?: () => void;
  onViewProject?: (project: PhotoProject) => void;
}

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

// Mock data until the backend's network/messaging endpoints exist.
const contacts: Contact[] = [
  { id: '1', name: 'Dr. Nadia Ivanova', role: 'Visual Culture Studies', university: 'UNSW Sydney', specialty: 'Identity, Photography', online: true },
  { id: '2', name: 'Prof. Jamal Okeke', role: 'Documentary Photography', university: 'University of Cape Town', specialty: 'African Visual Heritage', online: false },
  { id: '3', name: 'Dr. Lakshmi Devi', role: 'Indigenous Studies', university: 'University of Sydney', specialty: 'Himalayan Communities', online: true },
  { id: '4', name: 'Prof. Thomas Anderson', role: 'Human Geography', university: 'ANU Canberra', specialty: 'Pacific Climate Migration', online: true },
  { id: '5', name: 'Dr. Fatou Diop', role: 'Visual Communication', university: 'University of Melbourne', specialty: 'West African Media', online: false },
];

const jobOpportunities: JobOpportunity[] = [
  { id: '1', title: 'Documentary Photography Internship', organization: 'National Geographic Society', location: 'Remote/Washington DC', type: 'Internship', deadline: '2024-12-15', description: 'Join our documentary team to cover environmental and cultural stories across Southeast Asia.' },
  { id: '2', title: 'Visual Researcher - Indigenous Communities', organization: 'UNESCO', location: 'Paris, France', type: 'Full-time', deadline: '2024-12-30', description: 'Document indigenous cultural preservation projects in collaboration with local communities.' },
  { id: '3', title: 'Photojournalism Fellowship', organization: 'Magnum Foundation', location: 'Various Locations', type: 'Fellowship', deadline: '2025-01-10', description: 'One-year fellowship for emerging photographers focusing on social justice issues.' },
  { id: '4', title: 'Research Assistant - Urban Studies', organization: 'University of Sydney', location: 'Sydney, Australia', type: 'Part-time', deadline: '2024-12-20', description: 'Support visual documentation of urban transformation in Western Sydney communities.' },
];

// Newest four projects in the library, shown as a compact row under the passport.
const featured = [...photoProjects].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

const initials = (name: string) => name.replace(/^(Dr\.|Prof\.)\s+/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

export function ProfilePage({ onLogout, onViewProject }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [draft, setDraft] = useState<UserProfile>(userProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchContacts, setSearchContacts] = useState('');
  const [threads, setThreads] = useState<Record<string, Message[]>>({});

  const filteredContacts = contacts.filter((c) =>
    `${c.name} ${c.specialty}`.toLowerCase().includes(searchContacts.toLowerCase()),
  );

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    const msg = { text: messageText.trim(), at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setThreads((t) => ({ ...t, [selectedContact.id]: [...(t[selectedContact.id] ?? []), msg] }));
    setMessageText('');
    toast.success(`Message sent to ${selectedContact.name}`);
  };

  const saveProfile = () => {
    setProfile({ ...draft, interests: draft.interests.map((s) => s.trim()).filter(Boolean) });
    setEditOpen(false);
    toast.success('Profile updated');
  };

  const [mrz1, mrz2] = mrzLines(profile);
  const fullName = `${profile.givenNames} ${profile.surname}`;

  return (
    <div className="min-h-screen bg-[#F5F2E8] py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ── Passport spread ─────────────────────────────────────────── */}
        <section aria-label="Field passport" className="rounded-[22px] bg-[#1f3b44] p-2.5 sm:p-3.5 shadow-[0_24px_60px_-20px_rgba(31,59,68,.55)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 rounded-[14px] overflow-hidden">
            {/* Data page */}
            <div className="relative min-w-0 bg-[#f4efe3] p-5 sm:p-7 lg:border-r lg:border-[#d8ccb3]">
              <Guilloche />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[#1f3b44] text-xl tracking-[0.18em]" style={serif}>THE CHARTER</p>
                    <p className="text-[9.5px] tracking-[0.16em] text-[#8a7f6f] mt-0.5">FIELD PASSPORT · PASSEPORT DE TERRAIN · PASAPORTE DE CAMPO</p>
                  </div>
                  <div className="text-right text-[10px] text-[#8a7f6f]" style={mono}>
                    <div>TYPE <span className="text-[#23201d]">P</span> · CODE <span className="text-[#23201d]">TCH</span></div>
                    <div>No. <span className="text-[#23201d]">{profile.credentialNo}</span></div>
                  </div>
                </div>

                <div className="mt-5 flex gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <div className="w-[108px] h-[138px] sm:w-[124px] sm:h-[158px] rounded-sm bg-[#d8ccb3] overflow-hidden border border-[#c4b594] grid place-items-center">
                      <span className="text-5xl text-[#1f3b44]/70" style={serif}>{initials(fullName)}</span>
                    </div>
                    <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full border-2 border-[#9A7A3C]/70 grid place-items-center rotate-[-12deg] bg-[#f4efe3]/60 backdrop-blur-[1px]">
                      <BadgeCheck className="w-6 h-6 text-[#1d8cf0]" aria-hidden />
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-y-2 text-sm min-w-0">
                    <Field k="Surname / Nom / Apellido" v={profile.surname.toUpperCase()} />
                    <Field k="Given names / Prénoms / Nombres" v={profile.givenNames.toUpperCase()} />
                    <Field k="Programme" v={profile.degree} />
                    <Field k="Institution" v={profile.university} />
                  </dl>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Field k="Field of study" v={profile.specialization} />
                  <Field k="Based in" v={profile.location} />
                  <Field k="Member since" v={stampDate(profile.memberSince)} mono />
                  <Field k="Status" v={<span className="inline-flex items-center gap-1">{profile.role} <BadgeCheck className="w-3.5 h-3.5 text-[#1d8cf0]" aria-label="Verified institutional email" /></span>} />
                </dl>

                <p className="mt-4 text-[13px] leading-relaxed text-[#4a443d] max-w-prose">{profile.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.interests.map((i) => (
                    <span key={i} className="rounded-full border border-[#c4b594] px-2.5 py-0.5 text-[11.5px] text-[#4a443d]">{i}</span>
                  ))}
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9.5px] tracking-[0.14em] text-[#8a7f6f]">HOLDER'S SIGNATURE</p>
                    <p className="text-[17px] sm:text-[22px] whitespace-nowrap text-[#1f3b44] -rotate-2 mt-1" style={{ fontFamily: "'Homemade Apple', cursive" }}>{fullName}</p>
                  </div>
                  <p className="text-[11px] text-[#8a7f6f] truncate" style={mono}>{profile.email}</p>
                </div>

                <div className="mt-4 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 bg-[#ebe4d3] px-5 sm:px-7 py-3 overflow-x-auto" aria-label="Machine readable zone">
                  <p className="text-[12.5px] sm:text-[13.5px] tracking-[0.12em] text-[#23201d] whitespace-pre" style={mono}>{mrz1}</p>
                  <p className="text-[12.5px] sm:text-[13.5px] tracking-[0.12em] text-[#23201d] whitespace-pre" style={mono}>{mrz2}</p>
                </div>
              </div>
            </div>

            {/* Entries page */}
            <div className="relative min-w-0 bg-[#f7f3e9] p-5 sm:p-7">
              <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent hidden lg:block" aria-hidden />
              <div className="flex items-baseline justify-between">
                <h2 className="text-[#1f3b44] text-2xl" style={serif}>Entries</h2>
                <p className="text-[10px] tracking-[0.14em] text-[#8a7f6f]">VISAS · SAVED PROJECTS · PAGE 07</p>
              </div>
              <p className="mt-1 text-[13px] text-[#6f675f]">Each project you save gets a stamp. Click one to open it.</p>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-y-3">
                {entries.map((e, i) => (
                  <VisaStamp key={e.project.id} entry={e} index={i} onClick={() => onViewProject?.(e.project)} />
                ))}
                <div className="grid place-items-center">
                  <div className="w-full max-w-[190px] aspect-[4/3] rounded-full border-2 border-dashed border-[#c4b594] grid place-items-center text-center px-4">
                    <p className="text-[11px] leading-snug text-[#8a7f6f]" style={mono}>NEXT ENTRY<br />save a project from the map</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="border-[#1f3b44] text-[#1f3b44] hover:bg-[#1f3b44] hover:text-white"
            onClick={() => { setDraft(profile); setEditOpen(true); }}>
            <PenLine className="w-4 h-4 mr-2" /> Edit details
          </Button>
          {onLogout && (
            <Button variant="ghost" className="text-[#6f675f]" onClick={() => setLogoutOpen(true)}>
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          )}
        </div>

        {/* ── Featured projects ───────────────────────────────────────── */}
        <section className="mt-5" aria-labelledby="featured-h">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 id="featured-h" className="text-[22px] text-[#1f3b44]" style={serif}>Featured projects</h2>
            <span className="text-xs text-[#6f675f]">Newest in the library</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {featured.map((p) => (
              <button key={p.id} type="button" onClick={() => onViewProject?.(p)}
                className="group flex flex-col justify-start text-left bg-white rounded-[10px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E64626]">
                <div className="aspect-[16/9] overflow-hidden bg-[#e9e2d3]">
                  <img src={p.images[0]} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="px-3 pt-2 pb-3 min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.08em] font-bold" style={{ color: inkFor(p.category).ink }}>{inkFor(p.category).label}</span>
                  <span className="block text-[13.5px] leading-snug font-semibold text-[#23201d] line-clamp-2 mt-0.5">{p.title}</span>
                  <span className="block text-[11.5px] text-[#6f675f] truncate mt-0.5">{p.location.name}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Field map ───────────────────────────────────────────────── */}
        <section className="mt-6 bg-white rounded-2xl shadow-lg p-5 sm:p-7" aria-labelledby="fieldmap-h">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 id="fieldmap-h" className="text-2xl text-[#1f3b44]" style={serif}>Field map</h2>
            <p className="text-sm text-[#6f675f]">Your stamps in the order you saved them, starting from {profile.location.split(',')[0]}.</p>
          </div>
          <FieldMap entries={entries} home={profile.home} homeLabel={profile.location} onSelect={(e) => onViewProject?.(e.project)} />
        </section>

        {/* ── Network, saved, opportunities ──────────────────────────── */}
        <Tabs defaultValue="contacts" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-md">
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Contacts & Messages</span><span className="sm:hidden">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <BookmarkIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Saved Projects</span><span className="sm:hidden">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-[#E64626] data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Job Opportunities</span><span className="sm:hidden">Jobs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg mb-3 text-[#424242]">My Network</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search contacts..." value={searchContacts} onChange={(e) => setSearchContacts(e.target.value)} className="pl-10" />
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <button key={contact.id} onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${selectedContact?.id === contact.id ? 'bg-[#E64626]/10 border-[#E64626]' : 'hover:bg-gray-50 border-transparent'}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar><AvatarImage src={undefined} /><AvatarFallback className="bg-[#C9A86A] text-white">{initials(contact.name)}</AvatarFallback></Avatar>
                          {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" aria-label="Online" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#424242] truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.specialty}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!filteredContacts.length && <p className="text-sm text-gray-500 px-1">No contacts match “{searchContacts}”.</p>}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                {selectedContact ? (
                  <div className="flex flex-col h-full">
                    <div className="border-b pb-4 mb-4 flex items-center gap-3">
                      <Avatar><AvatarFallback className="bg-[#C9A86A] text-white">{initials(selectedContact.name)}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-lg text-[#424242]">{selectedContact.name}</h3>
                        <p className="text-sm text-gray-500">{selectedContact.role} • {selectedContact.university}</p>
                      </div>
                    </div>
                    <div className="flex-1 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
                      {(threads[selectedContact.id] ?? []).length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-8">Start a conversation with {selectedContact.name}</p>
                      ) : (
                        threads[selectedContact.id].map((m, i) => (
                          <div key={i} className="self-end max-w-[80%] rounded-2xl rounded-br-sm bg-[#1f3b44] text-white px-3.5 py-2">
                            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                            <p className="text-[10px] text-white/60 text-right mt-0.5">{m.at}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Textarea placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="flex-1 min-h-[80px]"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                      <Button onClick={handleSendMessage} className="bg-[#E64626] hover:bg-[#F68B1F] self-end" aria-label="Send message"><Send className="w-4 h-4" /></Button>
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

          <TabsContent value="saved" className="mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl text-[#424242] mb-6">Saved Projects ({entries.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.map(({ project, savedOn }) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group" onClick={() => onViewProject?.(project)}>
                    <div className="relative overflow-hidden">
                      <AspectRatio ratio={16 / 10}>
                        <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </AspectRatio>
                      <Badge className="absolute top-2 left-2 text-white" style={{ background: inkFor(project.category).ink }}>{inkFor(project.category).label}</Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="text-lg mb-2 text-[#424242] line-clamp-2">{project.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">by {project.photographer}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 gap-2">
                        <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{project.location.name}</span></span>
                        <span className="shrink-0">Saved {stampDate(savedOn)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl text-[#424242] mb-6">Saved Opportunities ({jobOpportunities.length})</h3>
              <div className="space-y-4">
                {jobOpportunities.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex-1">
                        <h4 className="text-lg text-[#424242] mb-1">{job.title}</h4>
                        <p className="text-gray-600 mb-2">{job.organization}</p>
                      </div>
                      <Badge className={
                        job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
                        job.type === 'Internship' ? 'bg-blue-100 text-blue-800' :
                        job.type === 'Fellowship' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>{job.type}</Badge>
                    </div>
                    <p className="text-gray-700 mb-4">{job.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <Button size="sm" className="bg-[#E64626] hover:bg-[#F68B1F]">Apply Now<ExternalLink className="w-4 h-4 ml-2" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit details */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit passport details</DialogTitle>
            <DialogDescription>Changes are kept for this session until the profile API is connected.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <EditField id="pf-given" label="Given names" value={draft.givenNames} onChange={(v) => setDraft({ ...draft, givenNames: v })} />
            <EditField id="pf-surname" label="Surname" value={draft.surname} onChange={(v) => setDraft({ ...draft, surname: v })} />
            <EditField id="pf-degree" label="Programme" value={draft.degree} onChange={(v) => setDraft({ ...draft, degree: v })} wide />
            <EditField id="pf-field" label="Field of study" value={draft.specialization} onChange={(v) => setDraft({ ...draft, specialization: v })} wide />
            <EditField id="pf-location" label="Based in" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} wide />
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="pf-bio">Bio</Label>
              <Textarea id="pf-bio" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="min-h-[90px]" />
            </div>
            <EditField id="pf-interests" label="Interests (comma separated)" value={draft.interests.join(', ')} onChange={(v) => setDraft({ ...draft, interests: v.split(',') })} wide />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-[#1f3b44] hover:bg-[#16303a]" onClick={saveProfile}>Save details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign out */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>You'll need your institutional email to sign back in.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Stay signed in</Button>
            <Button className="bg-[#E64626] hover:bg-[#cf3a1c]" onClick={() => { setLogoutOpen(false); onLogout?.(); }}>Sign out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ k, v, mono: isMono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] tracking-[0.12em] uppercase text-[#8a7f6f]">{k}</dt>
      <dd className="text-[#23201d] leading-snug" style={isMono ? mono : undefined}>{v}</dd>
    </div>
  );
}

function EditField({ id, label, value, onChange, wide }: { id: string; label: string; value: string; onChange: (v: string) => void; wide?: boolean }) {
  return (
    <div className={`grid gap-1.5 ${wide ? 'col-span-2' : ''}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Security-print rosette behind the data page. */
function Guilloche() {
  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="#b79a5b" strokeOpacity="0.14" strokeWidth="0.7" transform="translate(470 470)">
        {Array.from({ length: 36 }, (_, i) => (
          <ellipse key={i} rx="170" ry="16" transform={`rotate(${i * 5})`} />
        ))}
      </g>
      <g fill="none" stroke="#1f3b44" strokeOpacity="0.06" strokeWidth="0.6" transform="translate(-40 -40)">
        {Array.from({ length: 24 }, (_, i) => (
          <ellipse key={i} rx="110" ry="9" transform={`rotate(${i * 7.5})`} />
        ))}
      </g>
    </svg>
  );
}
