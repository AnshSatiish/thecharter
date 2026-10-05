# The Charter - Photojournalism Platform

A visual platform connecting photojournalists with social science students, researchers, and the general public through powerful photo essays and community engagement.

## 🌟 Overview

**The Charter** makes photojournalism accessible and engaging by:
- Displaying photo projects on an interactive world map
- Organizing content by themes relevant to academia and current events
- Connecting photographers with audiences and mentors
- Providing a community forum for networking and learning

## 🎯 Target Audiences

### Primary: Social Science Students
- Anthropology, Sociology, Journalism, Geography, International Relations
- Quick visual learning (10 images per project)
- Academic categorization system
- Research-friendly keyword search

### Secondary: General Public
- Visual news alternative to text-heavy media
- Discover stories from around the world
- Less time investment, more reliable than social media
- Exotic and educational content

### Photographers
- Showcase work with portfolio links
- Network with researchers and students
- Mentorship opportunities
- Equipment and technique discussions

## 📋 Features

### Map & Discovery
- **Interactive World Map** with color-coded project pins
- **5 Main Categories**:
  - 🌿 Wildlife-Human Interaction (ecology, conservation)
  - 🎭 Anthropology (traditions, cultures)
  - 🏙️ Urban Life (sociology, neighborhoods)
  - 🏝️ Islands (exotic locations)
  - 📰 News (current events)
- **Advanced Filtering**: Category, date, and keyword search
- **Real-time Updates**: Live project count and filtering

### Project Showcase
- Detailed photo essays with context
- Photographer bios and portfolio links
- Location and date information
- Keyword tagging for discovery
- Direct contact options

### Community
- **Forum** with 4 categories (Equipment, Project Inquiry, Mentorship, General)
- **Threaded Discussions** with likes and replies
- **Mentorship Program** for connecting experienced photographers with emerging talent
- **Networking Stats** (1,247 members, 342 posts, 89 mentors)

### User Experience
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Keyboard shortcuts (Alt+M, Alt+C, ESC)
- ✅ Toast notifications for feedback
- ✅ Smooth scroll transitions
- ✅ Back-to-top button
- ✅ Welcome banner for new users
- ✅ No-results states with clear CTAs

## 🛠️ Technology Stack

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS v4.0
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner
- **State Management**: React Hooks (useState, useMemo, useEffect)

## 📁 Project Structure

```
/
├── App.tsx                      # Main application component
├── components/
│   ├── Header.tsx              # Navigation & search
│   ├── FilterBar.tsx           # Category & date filters
│   ├── WorldMap.tsx            # Interactive map display
│   ├── ProjectCard.tsx         # Project preview cards
│   ├── ProjectDetail.tsx       # Project modal view
│   ├── Community.tsx           # Forum & mentorship
│   ├── ForumPostCard.tsx       # Individual forum post
│   ├── ForumThreadDetail.tsx   # Thread with replies
│   ├── WelcomeBanner.tsx       # Intro banner
│   ├── Footer.tsx              # Site footer
│   ├── BackToTop.tsx           # Scroll to top button
│   └── ui/                     # Shadcn components
├── data/
│   └── mockData.ts             # 15 projects + 8 forum posts
├── types/
│   └── index.ts                # TypeScript interfaces
└── styles/
    └── globals.css             # Global styles & tokens
```

## 🚀 Key Components

### App.tsx
- Central state management
- Navigation between Map and Community
- Filter logic (category, date, search)
- Keyboard shortcuts
- Modal management

### WorldMap
- Equirectangular projection
- Color-coded markers by category
- Hover tooltips
- Click to view project details

### Community
- Forum with search and filtering
- Create new posts dialog
- Mentorship program CTAs
- Community statistics

### ProjectDetail
- Full project information
- Contact photographer
- View similar projects
- External portfolio link

## 📊 Data Structure

### PhotoProject
```typescript
{
  id: string
  title: string
  photographer: string
  photographerWebsite: string
  category: 'wildlife' | 'anthropology' | 'urban' | 'islands' | 'news'
  location: { name: string, coordinates: { lat: number, lng: number } }
  date: string
  description: string
  images: string[]
  keywords: string[]
}
```

### ForumPost
```typescript
{
  id: string
  author: string
  authorRole: 'photographer' | 'researcher' | 'student'
  title: string
  content: string
  date: string
  replies: number
  category: 'equipment' | 'project-inquiry' | 'mentorship' | 'general'
}
```

## 🎨 Design System

- **Typography**: Configured in `globals.css` for each HTML element
- **Colors**: 
  - Wildlife: Green (#10B981)
  - Anthropology: Purple (#A855F7)
  - Urban: Gray (#374151)
  - Islands: Blue (#3B82F6)
  - News: Red (#EF4444)
- **Spacing**: Tailwind default scale
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## 🔧 Development Features

### State Management
- React Hooks for local state
- useMemo for optimized filtering
- useEffect for keyboard shortcuts and scroll listeners

### Performance
- Real-time filtering without backend calls
- Optimized re-renders with useMemo
- Lazy modal rendering

### Accessibility
- Keyboard navigation
- ARIA labels
- Semantic HTML
- Focus management in modals

## 📝 Content Guidelines

### For Photographers Submitting Projects
1. **10-20 high-quality images** per project
2. **Detailed description** of the story and context
3. **Accurate location** data for map placement
4. **Relevant keywords** for discoverability
5. **Portfolio link** for additional work

### For Forum Posts
1. **Descriptive titles** for better search
2. **Appropriate category** selection
3. **Respectful tone** for community engagement
4. **Context** in project inquiries

## 🎯 Future Enhancements

Potential features for future versions:
- [ ] User authentication (photographer/student accounts)
- [ ] Backend integration for real data
- [ ] Image galleries (multiple images per project)
- [ ] Comments on projects
- [ ] Save favorite projects
- [ ] Email notifications for forum replies
- [ ] Advanced search filters
- [ ] Project submission form
- [ ] Mentor matching algorithm
- [ ] Analytics dashboard
- [ ] Social sharing
- [ ] Multi-language support

## 📖 Documentation

- **USER_GUIDE.md**: Complete guide for end users
- **FEATURES.md**: List of all functional features
- **This README**: Technical documentation

## 🤝 Contributing

This is a prototype/MVP. Future contributions could include:
- Backend API integration
- Database schema design
- Authentication system
- Image upload and storage
- Advanced map features (clustering, zoom)
- Analytics and metrics

## 📄 License

Created for photojournalists to showcase their important work documenting our world.

---

**Built with ❤️ for the photojournalism community**

Supporting independent visual storytelling and connecting photographers with audiences who value their work.
