# Project Manager

An AI-native, file-based project management tool designed for developers who want to keep their project planning close to their code.

## Overview

Project Manager is built on a simple but powerful philosophy: **every epic and story is a JSON file in your repository**. This approach gives you:

- ✅ **Full version control** - Track changes to requirements over time with Git
- ✅ **Type safety** - TypeScript types and Zod validation for all data
- ✅ **AI integration** - Use Cursor AI to expand epics, generate stories, and refine acceptance criteria
- ✅ **Developer-friendly** - No separate PM tool; everything lives with your code
- ✅ **Simple architecture** - Clean UI on top of JSON files, no database needed

## Features

### 📁 File-Based Storage
All project data is stored as JSON files in a hierarchical `/pm` directory:
```
/pm
  /[project-name]/
    /project.json              # Project metadata
    /[epic-name]/
      /epic.json               # Epic metadata
      /STORY-*.json            # Story files
```

This hierarchical structure makes it easy to:
- Navigate related items (project → epics → stories)
- Organize by feature/module
- Bulk operations on epics or projects
- Clean separation of concerns

### 🤖 AI-Powered
- **Epic Expansion**: Break down epics into multiple stories with AI
- **Story Generation**: Generate acceptance criteria and technical details
- **File Path Suggestions**: AI suggests relevant files for each story
- **Smart Refinement**: Iteratively improve stories with AI assistance

### 💼 Project Management
- **Projects**: Top-level containers for organizing work
- **Epics**: High-level features or initiatives
- **Stories**: Individual units of work with:
  - Title, summary, and detailed description
  - Acceptance criteria (list)
  - Status tracking (todo, in progress, blocked, done, archived)
  - Priority levels (low, medium, high, critical)
  - Story point estimates
  - Assignees and due dates
  - Links to code files
  - Tags for organization

### 📊 Analytics & Metrics
The application includes a comprehensive analytics dashboard that provides real-time insights:

#### Key Metrics
- **Completion**: Overall project progress with visual progress bars
- **Velocity**: Story points completed in the last 2 weeks
- **Burn Rate**: Average story points completed per day
- **Critical Items**: Count of high-priority pending work

#### Status Distribution
- Visual breakdown of stories by status (To Do, In Progress, Blocked, Done)
- Color-coded progress bars for quick insights
- Percentage calculations for each status

#### Epic Progress Tracking
- Completion percentage for each epic
- Story count and total points per epic
- Color-coded progress indicators (green=complete, blue=50%+, yellow=<50%)

#### Risk Analysis
- **Top 5 Stories at Risk**: Identifies stories needing attention based on:
  - Blocked status (+50 risk points)
  - Critical priority (+30 points)
  - High priority (+20 points)
  - Overdue status (+40 points)
  - Age > 30 days (+10 points)

#### Additional Metrics
- Total epics count
- Average story age (in days)
- Team size (contributors)
- Average stories per epic

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ProjectManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3004](http://localhost:3004)

### First-Time Setup

The application will create the `/pm` directory structure on first run with sample data to help you get started.

## Usage

### Keyboard Navigation

The application supports comprehensive keyboard navigation, especially in **Focus Mode** (activated by clicking the `<>` icon next to "Epics & Stories").

#### Focus Mode Navigation

**Activating Focus Mode:**
- Click the `<>` icon next to "Epics & Stories" to enter focus mode
- The sidebar expands to full width for dedicated epic and story management
- Click `><` to exit focus mode

**Navigating Items:**
- **Arrow Up (↑)**: Move focus to the previous epic or story
- **Arrow Down (↓)**: Move focus to the next epic or story
- Focus automatically wraps around (from last item to first, and vice versa)

**Expanding/Collapsing Epics:**
- **Arrow Right (→)**: Expand the focused epic (show its stories)
- **Arrow Left (←)**: Collapse the focused epic (hide its stories)
- **Space**: Toggle expand/collapse for the focused epic

**Editing Titles:**
- **Enter**:
  - If not editing: Enter edit mode for the focused epic/story title
  - If already editing: Save changes and exit edit mode
- **Escape**: Cancel editing and discard changes

**Visual Feedback:**
- Focused items are highlighted with a blue ring and background
- Items automatically scroll into view when focused
- Edit mode shows an input field with a blue underline

#### Normal Mode

In normal (non-focus) mode, you can:
- Click on epics and stories to select them
- Use the right panel to edit details
- Click epic titles to expand/collapse

### Accessing Analytics

**From Header Navigation:**
1. Click "Analytics" in the header
2. Select a project tab to view its metrics

**From Project Page:**
1. Open any project
2. Click the analytics icon (bar chart) next to the project title

The analytics dashboard provides real-time insights including:
- Key performance metrics (completion, velocity, burn rate)
- Status distribution charts
- Epic progress overview
- Top 5 stories at risk
- Additional project metrics

### Creating a Project

1. Navigate to the Projects page
2. Click "New Project"
3. Fill in project details (name, description)
4. Save to create `/pm/{project-name}/project.json`

### Creating an Epic

1. Open a project
2. Click "New Epic"
3. Provide epic title and description
4. Optionally use AI to generate stories from the epic description
5. Save to create `/pm/{project-name}/{epic-name}/epic.json`

### Creating Stories

**Manual Creation:**
1. Open an epic
2. Click "New Story"
3. Fill in story details, acceptance criteria, etc.
4. Save to create `/pm/{project-name}/{epic-name}/STORY-{id}.json`

**AI-Powered Creation:**
1. Open an epic
2. Click "Generate Stories with AI"
3. Provide context or let AI analyze the epic description
4. Review and edit generated stories
5. Save all stories at once

### Editing Stories

1. Click on any story to open the editor
2. Edit metadata in the left panel
3. Edit description and acceptance criteria in the center panel
4. Changes are saved immediately to the JSON file
5. Commit changes to Git like any other code change

## Architecture

### Tech Stack
- **Frontend**: Next.js 14.2 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

### File Structure
```
ProjectManager/
├── src/
│   ├── app/                 # Pages and API routes
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and data layer
│   └── theme/               # Design tokens
├── scripts/                 # Automation scripts
├── pm/                      # Project management data
│   └── [project-name]/      # Hierarchical structure
│       ├── project.json
│       └── [epic-name]/
│           ├── epic.json
│           └── STORY-*.json
└── CLAUDE.md                # AI assistant context
```

### Data Flow
1. UI components call API routes (`/api/projects`, `/api/epics`, `/api/stories`)
2. API routes use `pmRepository` to read/write JSON files
3. All data validated with Zod schemas
4. JSON files committed to Git for version control

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3004)

# Build
npm run build            # Production build
npm run start            # Start production server

# Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Automation
npm run update-claude    # Update CLAUDE.md files
npm run setup-git-hook   # Setup git hooks for CLAUDE.md
```

### Project Structure

See `CLAUDE.md` for detailed documentation of the application architecture, including:
- Component organization
- API route patterns
- Data model schemas
- Common development patterns

### AI Integration with Cursor

This project is designed to work seamlessly with Cursor AI:

1. **CLAUDE.md Files**: Each directory has a `CLAUDE.md` file that provides context to AI assistants
2. **Structured Data**: JSON files can be read and understood by AI
3. **Type Definitions**: TypeScript types help AI generate valid code
4. **Clear Patterns**: Consistent patterns make it easy for AI to extend functionality

**Example AI Prompts:**
- "Generate 5 stories for the user authentication epic"
- "Add acceptance criteria to STORY-123"
- "Suggest file paths for implementing this story"
- "Break down this epic into technical tasks"

## Configuration

### Environment Variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Currently minimal configuration is needed. Future additions may include:
- AI API keys (for automated story generation)
- Git integration settings
- Custom storage paths

### Customization

**Theme Colors**: Edit `tailwind.config.js`
**Data Location**: Modify `PM_DATA_DIR` in `src/lib/pm-repository.ts`
**Status Options**: Update project JSON `defaultStatuses` array
**Priority Levels**: Update project JSON `defaultPriorities` array

## Roadmap

### Phase 1: Core Functionality ✅
- [x] File-based storage with JSON
- [x] Project, Epic, Story data models
- [x] Basic CRUD operations
- [x] Clean UI with forms and editors

### Phase 2: Enhanced Features ✅
- [x] Analytics dashboard with real-time metrics
- [x] Risk analysis for identifying at-risk stories
- [x] Velocity and burn rate tracking
- [x] Epic progress visualization
- [x] Status distribution charts
- [ ] Rich markdown editor for descriptions
- [ ] Drag-and-drop story prioritization
- [ ] Epic and story templates
- [ ] Bulk operations (delete, move, archive)

### Phase 3: AI Integration
- [ ] AI-powered story generation from epic
- [ ] Acceptance criteria suggestions
- [ ] Technical breakdown recommendations
- [ ] Code file path suggestions
- [ ] Story estimation assistance

### Phase 4: Advanced Features
- [ ] Git integration (auto-update stories from commits)
- [ ] Timeline and Gantt chart views
- [ ] Sprint planning and tracking
- [ ] Team collaboration features
- [ ] Export to other formats (CSV, PDF, Markdown)
- [ ] Imoport Storied from xlsx file

## Contributing

Contributions are welcome! Since this is a file-based system:

1. Fork the repository
2. Create your feature branch
3. Make changes (code + JSON files)
4. Commit both code and data files
5. Push and create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check the `/docs` directory for additional documentation
- Review `CLAUDE.md` files for technical details

---

**Built with ❤️ for developers who want their project management to live with their code.**
