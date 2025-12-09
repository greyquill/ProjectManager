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
- A "Focus Mode" indicator appears centered between the heading and "+ Epic" button
- Click `><` to exit focus mode

**Navigating Items:**
- **Arrow Up (↑)**: Move focus to the previous epic or story. Wraps to "+ Add Epic" row when at the top
- **Arrow Down (↓)**: Move focus to the next epic or story. Wraps to first item when at "+ Add Epic" row
- Focus automatically wraps around (from last item to first, and vice versa)

**Expanding/Collapsing Epics:**
- **Arrow Right (→)**: Expand the focused epic (show its stories)
- **Arrow Left (←)**: Collapse the focused epic (hide its stories)
- **Space**: Toggle expand/collapse for the focused epic

**Editing Titles:**
- **Enter**:
  - If focused on epic/story: Enter edit mode for the title (if not editing) or save and exit (if editing)
  - If focused on "+" icon row: Open the story creation form
  - If focused on "+ Add Epic" input: Create the epic with the entered title
  - If focused on story creation form: Create the story (title only required in focus mode)
  - If focused on a dropdown: Open the dropdown menu
  - If focused on Save button: Save the current epic/story
- **Escape**: Cancel editing, close forms, or discard changes

**Creating Items:**
- **Stories in Focus Mode**: Navigate to "+" icon row, press Enter, type title, press Enter to create. Form is simplified (title only, priority defaults to Medium, manager defaults to project manager). Focus returns to "+" icon after creation.
- **Epics in Focus Mode**: Navigate to "+ Add Epic" row at bottom, type title, press Enter to create. Focus returns to input after creation.

**Visual Feedback:**
- Focused items are highlighted with a blue ring and background
- The "+ Add Epic" row shows a prominent thick blue border (border-4) when focused
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

**In Focus Mode (Quick Creation):**
1. Navigate to the "+ Add Epic" row at the bottom (light blue bar)
2. Type the epic title
3. Press Enter to create
4. Focus returns to input for creating another epic
5. New epics appear at the bottom with ID prefix [EPIC-XXXX]

**In Normal Mode (Full Form):**
1. Open a project
2. Click "+ Epic" button
3. Fill in epic details (title, summary, description)
4. Set priority and manager
5. Click "Create Epic"

**Epic ID Format:**
- Epics are assigned sequential IDs: EPIC-0001, EPIC-0002, etc.
- In Focus Mode, epic titles display with ID prefix: `[EPIC-XXXX] Epic Title`
- The prefix is hidden when editing for easier text manipulation

### Creating Stories

**In Focus Mode (Simplified & Instant):**
1. Navigate to the "+" icon row under an expanded epic
2. Press Enter to open the story creation form
3. Type the story title (only field required)
4. Press Enter to create, or ESC to cancel
5. Focus automatically returns to "+" icon for quick creation of another story

**Focus Mode Features:**
- **Optimistic Updates**: Stories appear instantly in the UI with zero perceived delay. The API call happens in the background, and the story is updated with the real ID when the server responds.
- **Simplified Form**: Only title field is shown (summary, priority, and manager fields are hidden)
- **Smart Defaults**: Priority defaults to "Medium", manager defaults to the project manager (if available)
- **Rapid Creation**: Form stays open after creation, allowing you to create multiple stories in quick succession without interruption

**In Normal Mode (Full Form):**
1. Open an epic
2. Click "New Story" (the "+" button at the bottom of the epic)
3. Fill in story details (title and summary required)
4. Set priority and manager
5. Click "Create Story"

**Story ID Format:**
- Stories are assigned sequential IDs: STORY-001, STORY-002, etc.
- Story titles always display with ID prefix: `[STORY-XXX] Story Title`
- The prefix is hidden when editing for easier text manipulation

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

### Deleting Stories and Epics

**Deleting Stories:**
1. Open a story in the detail panel
2. Scroll to the bottom left of the card
3. Click the "Delete Story" button (red, with trash icon)
4. A modal will appear requesting your login code (2341)
5. Enter the code and click "Delete" to confirm
6. The story is **soft-deleted** (marked as `deleted: true` in the JSON file)
7. Soft-deleted stories are:
   - Removed from the UI immediately
   - Preserved in the file system/KV for ID sequencing
   - Not included in story lists or counts
   - Can be recovered by manually editing the JSON file

**Deleting Epics:**
1. Open an epic in the detail panel
2. Scroll to the bottom left of the card
3. Click the "Delete Epic" button (red, with trash icon)
4. **Validation Check**: If the epic contains active stories, a validation modal will appear explaining that all stories must be removed or moved first
5. If validation passes, a modal will appear requesting your login code (2341)
6. Enter the code and click "Delete" to confirm
7. The epic is **hard-deleted** (completely removed from storage)

**Delete Functionality Details:**

**Security:**
- All deletions require login code verification (2341)
- Login code is validated server-side
- Incorrect code shows "Nope!" error message with fade-in animation
- Modal can be dismissed by clicking outside, pressing Escape, or clicking Cancel

**Validation:**
- **Epic Deletion**: Frontend and backend both validate that epic has no active stories
- If validation fails, an interactive validation modal appears (not an error message)
- Validation modal shows:
  - Clear title: "Cannot Delete Epic"
  - Warning message in amber/yellow box
  - "Understood" button to dismiss
  - Close (X) button in header
- Stories can be deleted without validation (no dependencies)

**API Endpoints:**
- `DELETE /api/projects/[projectName]/epics/[epicName]/stories/[storyId]` - Soft deletes a story
- `DELETE /api/projects/[projectName]/epics/[epicName]` - Hard deletes an epic (with validation)

**Soft Deletion Implementation:**
- Stories use soft deletion (`deleted: true` flag) to preserve ID sequencing
- `listActiveStories()` filters out deleted stories
- `listStories()` returns all stories (including deleted) for ID generation
- Deleted stories are removed from epic's `storyIds` array
- Story files/KV entries remain for maintaining sequential IDs

**Hard Deletion Implementation:**
- Epics are completely removed from storage
- Backend validates no active stories exist before deletion
- Epic's `storyIds` array is checked against active stories list
- Returns 400 error if validation fails with descriptive message

**UI Behavior:**
- Delete buttons appear at bottom left of detail cards
- Red styling indicates destructive action
- Modals are non-blocking (can be dismissed)
- After successful deletion:
  - Selection is cleared
  - Epics list is refreshed
  - User is returned to project overview

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
1. UI components call API routes (`/api/projects`, `/api/epics`, `/api/stories`, `/api/people`, `/api/auth`)
2. API routes use `pmRepository` to read/write JSON files
3. All data validated with Zod schemas
4. Authentication handled via httpOnly cookies and middleware
5. JSON files committed to Git for version control

### Optimistic Updates (Focus Mode)
In Focus Mode, story creation uses **optimistic updates** for zero-delay user experience:
- Stories appear instantly in the UI with a temporary ID (`TEMP-{timestamp}`)
- Form clears immediately, allowing rapid creation of multiple stories
- API call happens asynchronously in the background (non-blocking)
- When the server responds, the temporary story is replaced with the real one (proper ID, formatted title)
- If the API call fails, the optimistic story is automatically rolled back and an error is shown
- This ensures the UI feels instant and responsive, even with network latency

### Delete Operations

**Story Deletion (Soft Delete):**
- Stories are soft-deleted by setting `deleted: true` flag in the `StorySchema`
- Deleted stories remain in storage (file system or KV) for ID sequencing
- `deleteStory()` function:
  - Sets `deleted: true` on story object
  - Updates `updatedAt` timestamp
  - Removes story ID from epic's `storyIds` array
  - Preserves story file/KV entry
- `listActiveStories()` filters out deleted stories (used by UI)
- `listStories()` returns all stories including deleted (used for ID generation)
- `readStory()` throws error if attempting to read a deleted story
- Soft deletion ensures story IDs remain sequential even after deletions

**Epic Deletion (Hard Delete):**
- Epics are hard-deleted (completely removed from storage)
- `deleteEpic()` function:
  - Validates no active stories exist (frontend and backend)
  - Removes epic from project's `epicIds` array
  - Deletes epic file/KV entry completely
- Validation occurs at:
  - **Frontend**: Before showing delete modal (prevents unnecessary API calls)
  - **Backend**: Before actual deletion (safety check, returns 400 if validation fails)
- Backend uses `listActiveStories()` to check for active stories
- Returns descriptive error message if epic contains stories

**Repository Functions:**
- `pmRepository.deleteStory(projectName, epicName, storyId)` - Soft delete story
- `pmRepository.deleteEpic(projectName, epicName)` - Hard delete epic
- `pmRepository.listActiveStories(projectName, epicName)` - Get non-deleted stories
- `pmRepository.listStories(projectName, epicName)` - Get all stories (including deleted)

**API Endpoints:**
- `DELETE /api/projects/[projectName]/epics/[epicName]/stories/[storyId]`
  - Soft deletes a story
  - Returns 200 on success
  - Returns 404 if story doesn't exist
  - Returns 500 on error
- `DELETE /api/projects/[projectName]/epics/[epicName]`
  - Hard deletes an epic
  - Validates no active stories exist (returns 400 if validation fails)
  - Returns 200 on success
  - Returns 404 if epic doesn't exist
  - Returns 500 on error

**UI Implementation:**
- Delete buttons located at bottom left of detail cards
- Red styling (`text-red-600`, `border-red-300`) indicates destructive action
- Two modal types:
  1. **Validation Modal**: Shows when epic has stories (amber/yellow warning box)
  2. **Delete Confirmation Modal**: Shows login code input (password field)
- Login code verification (2341) required for all deletions
- Error handling:
  - Incorrect login code: Shows "Nope!" with fade-in animation
  - Validation failure: Shows interactive validation modal
  - API errors: Shows error message in delete modal
- After successful deletion:
  - Selection is cleared (`clearSelection()`)
  - Epics list is refreshed (`fetchEpics()`)
  - User is returned to project overview

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
- [x] Rich markdown editor for descriptions
- [x] Drag-and-drop story prioritization
- [x] Delete functionality with login code verification
- [x] Soft deletion for stories (preserves ID sequencing)
- [x] Validation modals for epic deletion
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
