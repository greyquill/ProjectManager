# Project Manager - PM App

## Project Overview
**Project Manager** is an AI-native project management tool built with a file-based, type-safe approach. Every epic and story is a JSON file checked into the repository, enabling full version control and seamless integration with development workflows.

### Core Philosophy
- **File-based and type-safe**: Every epic and story is a JSON file in your repo
- **AI-native**: Cursor AI integration for epic expansion, story generation, and technical breakdowns
- **Simple but powerful**: Clean UI on top of JSON files with inline forms and markdown editors
- **Dev-first**: Everything lives next to the code, editable in the same repo

## Tech Stack

### Core Framework
- **Next.js 14.2.4** (App Router)
- **React 18.3.1**
- **TypeScript 5.4.5**
- **Tailwind CSS 3.4.4**

### Key Dependencies
- **UI Components**: Lucide React for icons, Framer Motion for animations
- **Forms**: React Hook Form + Zod validation
- **File System**: Node.js fs module for JSON file operations

## Architecture

### Directory Structure
```
ProjectManager/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── projects/           # Project pages
│   │   ├── epics/              # Epic pages
│   │   ├── stories/            # Story pages
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable components
│   ├── lib/                    # Utilities and services
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── pm-repository.ts    # File-based data layer
│   │   └── utils.ts            # Helper functions
│   └── theme/                  # Theme configuration
├── scripts/                    # Automation scripts
└── pm/                         # Project management data (hierarchical)
    └── [project-name]/
        ├── project.json
        └── [epic-name]/
            ├── epic.json
            └── STORY-*.json
```

### Key Features

#### 1. File-Based Storage
- All data stored as JSON files under `/pm` directory
- Full Git version control
- Easy to backup, migrate, and collaborate
- No database required

#### 2. Type-Safe Data Model
- **Project**: Top-level container grouping epics
- **Epic**: High-level feature or initiative containing multiple stories
- **Story**: Individual unit of work with acceptance criteria and file links

#### 3. AI Integration
- Epic expansion into multiple stories
- Acceptance criteria generation
- Technical file path suggestions
- Story refinement and breakdown

#### 4. Clean UI
- Project dashboard with epic overview
- Epic detail view with story list and metrics
- Story editor with inline metadata forms
- Markdown support for descriptions

## Development

### Scripts
```bash
npm run dev          # Start dev server on port 3004
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
```

### Port
- Development: `3004`

## Data Model

### Story JSON Schema
```typescript
{
  id: string
  epicId: string
  title: string
  summary: string
  description: string
  acceptanceCriteria: string[]
  status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
  dueDate: string | null
  tags: string[]
  estimate: { storyPoints: number, confidence: string }
  relatedStories: string[]
  files: Array<{ path: string, role: string }>
  metadata: object
}
```

### Epic JSON Schema
```typescript
{
  id: string
  projectId: string
  title: string
  summary: string
  description: string
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
  targetRelease: string
  storyIds: string[]
  metrics: { totalStoryPoints: number, completedStoryPoints: number }
  metadata: object
}
```

### Project JSON Schema
```typescript
{
  id: string
  name: string
  description: string
  epicIds: string[]
  defaultStatuses: string[]
  defaultPriorities: string[]
  metadata: object
}
```

## API Routes

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/[id]` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/[id]` - Update project

### Epics
- `GET /api/epics` - List epics (filtered by project)
- `GET /api/epics/[id]` - Get epic details
- `POST /api/epics` - Create new epic
- `PUT /api/epics/[id]` - Update epic

### Stories
- `GET /api/stories` - List stories (filtered by epic)
- `GET /api/stories/[id]` - Get story details
- `POST /api/stories` - Create new story
- `PUT /api/stories/[id]` - Update story

## Design Principles

### User Experience
- **Simplicity First**: Clean, uncluttered interface
- **Developer-Friendly**: Familiar patterns and workflows
- **Fast Navigation**: Quick access to projects, epics, and stories
- **Inline Editing**: Edit metadata and content without modal dialogs

### Code Quality
- **TypeScript**: Strict type checking throughout
- **Validation**: Zod schemas for all data structures
- **Error Handling**: Comprehensive error messages
- **File Safety**: Atomic writes and backups

### Performance
- **Fast Builds**: Optimized Next.js configuration
- **Lazy Loading**: Code splitting for non-critical components
- **Efficient Reads**: Caching for frequently accessed files

## Common Patterns

### Reading Data
```typescript
import { pmRepository } from '@/lib/pm-repository'

const project = await pmRepository.readProject('healthcare-platform')
const epic = await pmRepository.readEpic('healthcare-platform', 'patient-management')
const story = await pmRepository.readStory('healthcare-platform', 'patient-management', 'STORY-123')

// List operations
const projects = await pmRepository.listProjects()
const epics = await pmRepository.listEpics('healthcare-platform')
const stories = await pmRepository.listStories('healthcare-platform', 'patient-management')
```

### Writing Data
```typescript
await pmRepository.writeStory(
  'healthcare-platform',
  'patient-management',
  'STORY-123',
  updatedStoryData
)
```

### Form Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { storySchema } from '@/lib/types'

const form = useForm({
  resolver: zodResolver(storySchema),
  mode: 'onChange'
})
```

## Important Notes for AI Assistants

1. **File-Based Architecture**: All data operations go through the `pmRepository` module which handles file system operations.

2. **Type Safety**: Use the TypeScript types defined in `@/lib/types` for all data structures.

3. **Validation**: Always validate data with Zod schemas before writing to files.

4. **Atomic Operations**: File writes should be atomic to prevent data corruption.

5. **AI Integration**: When implementing AI features, provide clear prompts and structured output expectations.

6. **Git Integration**: Changes to PM files should be committed to version control.

7. **Error Handling**: Provide user-friendly error messages while logging technical details.

8. **Status Tracking**: Update story/epic status and timestamps on changes.

---

**Last Updated**: 2025-12-08
**Maintained By**: Development Team
**AI Assistant**: Claude 3.5 Sonnet

