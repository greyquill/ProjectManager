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
- Stories use the format: `F-XXX-###` for functional requirements or `NFR-XXX-###` for non-functional requirements
- **Prefix**: `F-` for functional, `NFR-` for non-functional
- **Epic Acronym**: 2-6 uppercase characters derived from the epic title (e.g., "Revenue Cycle Management" → "RCM", "Scheduling" → "SCHED")
- **Number**: 3-digit sequential number (001, 002, 003, etc.) that is unique across the entire project
- Examples: `F-RCM-001`, `F-SCHED-021`, `NFR-SCHED-001`, `F-AI-002`
- Story titles display with ID prefix: `[F-XXX-###] Story Title` or `[NFR-XXX-###] Story Title`
- The prefix is hidden when editing for easier text manipulation

**AI-Powered Creation:**
1. Open an epic
2. Click "Generate Stories with AI"
3. Provide context or let AI analyze the epic description
4. Review and edit generated stories
5. Save all stories at once

### Manual File Management

If you're creating or modifying project files manually (outside the UI), follow these guidelines to ensure changes are visible in the UI:

#### Story ID Format and Structure

**Story ID Format:**
- **Functional Requirements**: `F-{EPIC_ACRONYM}-{NUMBER}`
  - Example: `F-RCM-001`, `F-SCHED-021`, `F-AI-002`
- **Non-Functional Requirements**: `NFR-{EPIC_ACRONYM}-{NUMBER}`
  - Example: `NFR-SCHED-001`, `NFR-CUSTOM-011`
- **Epic Acronym**: 2-6 uppercase characters derived from the epic title (e.g., "RCM", "SCHED", "CUSTOM")
- **Number**: 3-digit sequential number (001-999), unique across the entire project

**Story File Structure:**
```json
{
  "id": "F-SCHED-001",
  "requirementType": "functional",
  "epicId": "intelligent-scheduling",
  "title": "Story Title",
  "summary": "Brief summary",
  "description": "Detailed description",
  "acceptanceCriteria": [],
  "status": "todo",
  "priority": "medium",
  "manager": "person-001",
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-01-15T00:00:00Z",
  "dueDate": null,
  "tags": ["functional", "SCHED", "Provider Schedule Management"],
  "estimate": {
    "storyPoints": 0,
    "confidence": "medium"
  },
  "relatedStories": [],
  "mentions": [],
  "files": [],
  "metadata": {
    "createdBy": "system",
    "lastEditedBy": "system",
    "custom": {}
  },
  "deleted": false,
  "archived": false
}
```

**Required Fields:**
- `id`: Must match format `F-XXX-###` or `NFR-XXX-###`
- `requirementType`: `"functional"` or `"non-functional"`
- `epicId`: The epic folder name (kebab-case)
- `title`: Story title (required, min 1 character)
- `status`: `"todo"`, `"in_progress"`, `"blocked"`, or `"done"`
- `priority`: `"low"`, `"medium"`, `"high"`, or `"critical"`
- `createdAt` and `updatedAt`: ISO 8601 datetime strings
- `deleted`: Boolean (default `false`)
- `archived`: Boolean (default `false`)

**Optional Fields:**
- `summary`: Brief summary (can be empty)
- `description`: Detailed description (can be empty)
- `acceptanceCriteria`: Array of strings
- `manager`: Person ID (e.g., `"person-001"`)
- `dueDate`: ISO 8601 datetime string or `null`
- `tags`: Array of strings
- `estimate`: Object with `storyPoints` (number) and `confidence` (string)
- `plannedStartDate`, `plannedDueDate`, `actualStartDate`, `actualDueDate`: Date strings (YYYY-MM-DD) or `null`

#### Making Manual Changes Visible in the UI

**After Creating/Modifying Files:**

1. **Refresh the Browser**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - Or simply refresh: `F5` or `Cmd+R` / `Ctrl+R`

2. **Restart Development Server** (if changes aren't appearing)
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

3. **Check File Structure**
   - Ensure files are in the correct location: `/pm/[project-name]/[epic-name]/[story-id].json`
   - Verify file names match the story ID exactly (e.g., `F-SCHED-001.json`)

4. **Update Parent Files**
   - **Epic JSON**: Add story ID to `storyIds` array in `epic.json`
   - **Project JSON**: Add epic folder name to `epicIds` array in `project.json`

**Example: Adding a New Story Manually**

1. Create the story file: `/pm/healthcare-platform/intelligent-scheduling/F-SCHED-031.json`
2. Update `epic.json`:
   ```json
   {
     "storyIds": [
       "F-SCHED-001",
       "F-SCHED-002",
       ...
       "F-SCHED-031"  // Add new story ID here
     ]
   }
   ```
3. Refresh the browser or restart the dev server

**Example: Adding a New Epic Manually**

1. Create epic folder: `/pm/healthcare-platform/new-epic-name/`
2. Create `epic.json` in the folder with proper structure
3. Update `project.json`:
   ```json
   {
     "epicIds": [
       "revenue-cycle-management",
       "intelligent-scheduling",
       "new-epic-name"  // Add epic folder name here
     ]
   }
   ```
4. Refresh the browser

**Common Issues:**

- **Stories not showing**: Check that the story ID is in the epic's `storyIds` array
- **Epic not showing**: Check that the epic folder name is in the project's `epicIds` array
- **Validation errors**: Ensure all required fields are present and match the schema
- **ID format errors**: Verify story IDs match `F-XXX-###` or `NFR-XXX-###` format
- **Date format errors**: Use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) or date format (`YYYY-MM-DD`) for dates, or `null` for empty dates

**File Naming Conventions:**
- Project folders: kebab-case (e.g., `healthcare-platform`)
- Epic folders: kebab-case (e.g., `intelligent-scheduling`)
- Story files: Match story ID exactly (e.g., `F-SCHED-001.json`, `NFR-RCM-001.json`)
- Epic files: Always named `epic.json`
- Project files: Always named `project.json`

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
- **Markdown Editor**: @uiw/react-md-editor
- **Drag and Drop**: @dnd-kit/core, @dnd-kit/sortable

### UI Components

The application includes a set of reusable UI components designed to match Vercel's design system:

#### Select Component (`src/components/Select.tsx`)

A custom dropdown component that replaces native `<select>` elements with a button-based dropdown menu.

**Features:**
- Button-based interface (not a native select)
- Dropdown menu with checkmarks for selected items
- Chevron icon that rotates when open
- Hover states and focus rings
- Keyboard accessible

**Usage:**
```tsx
import { Select } from '@/components/Select'

<Select
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  placeholder="Select an option..."
  className="text-sm"
  disabled={false}
/>
```

**Props:**
- `value: string` - Currently selected value
- `onChange: (value: string) => void` - Callback when selection changes
- `options: SelectOption[]` - Array of `{ value: string, label: string }` objects
- `placeholder?: string` - Placeholder text when no option is selected
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the select

#### DatePicker Component (`src/components/DatePicker.tsx`)

A styled date input with a calendar icon, matching Vercel's design.

**Features:**
- Calendar icon on the left
- Light gray border with hover states
- Focus ring on interaction
- Min/max date validation support

**Usage:**
```tsx
import { DatePicker } from '@/components/DatePicker'

<DatePicker
  value={dateValue}
  onChange={(value) => setDateValue(value)}
  placeholder="Select date"
  className="text-sm"
  min="2024-01-01"
  max="2024-12-31"
  disabled={false}
/>
```

**Props:**
- `value?: string` - Date value in YYYY-MM-DD format
- `onChange?: (value: string) => void` - Callback when date changes
- `placeholder?: string` - Placeholder text
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the date picker
- `min?: string` - Minimum date (YYYY-MM-DD)
- `max?: string` - Maximum date (YYYY-MM-DD)

#### DateRangePicker Component (`src/components/DateRangePicker.tsx`)

A date range selector with start and end date inputs.

**Features:**
- Calendar icon trigger button
- Dropdown panel with start/end date inputs
- Clear and Apply buttons
- Formatted date range display

**Usage:**
```tsx
import { DateRangePicker } from '@/components/DateRangePicker'

<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onChange={(start, end) => {
    setStartDate(start)
    setEndDate(end)
  }}
  className="text-sm"
/>
```

**Props:**
- `startDate?: string` - Start date in YYYY-MM-DD format
- `endDate?: string` - End date in YYYY-MM-DD format
- `onChange?: (startDate: string | undefined, endDate: string | undefined) => void` - Callback when range changes
- `className?: string` - Additional CSS classes

#### FilterDropdown Component (`src/components/FilterDropdown.tsx`)

A searchable dropdown filter component with search functionality.

**Features:**
- Search bar at the top for filtering options
- Checkmarks for selected items
- Icon support for options
- Searchable with real-time filtering
- Vercel-style design

**Usage:**
```tsx
import { FilterDropdown } from '@/components/FilterDropdown'

<FilterDropdown
  placeholder="All Branches..."
  searchPlaceholder="Search branches..."
  options={[
    { value: 'main', label: 'main', icon: <Circle /> },
    { value: 'develop', label: 'develop' },
  ]}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  searchable={true}
  className="min-w-[140px]"
/>
```

**Props:**
- `placeholder: string` - Placeholder text for the button
- `options: FilterDropdownOption[]` - Array of options with optional icons
- `value?: string` - Currently selected value
- `onChange?: (value: string) => void` - Callback when selection changes
- `searchable?: boolean` - Enable search functionality (default: true)
- `className?: string` - Additional CSS classes
- `searchPlaceholder?: string` - Placeholder for search input

**Where Used:**
- Manager dropdowns in Epic and Story detail pages
- Project manager selection
- File role selection
- All date inputs throughout the application
- Filter components (when implemented)

### File Structure
```
ProjectManager/
├── src/
│   ├── app/                 # Pages and API routes
│   ├── components/          # Reusable UI components
│   │   ├── Select.tsx       # Custom dropdown component
│   │   ├── DatePicker.tsx   # Single date picker
│   │   ├── DateRangePicker.tsx  # Date range selector
│   │   ├── FilterDropdown.tsx    # Searchable filter dropdown
│   │   ├── MarkdownEditor.tsx   # Rich markdown editor
│   │   └── ...              # Other components
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

# KV Storage Management
npm run export-to-kv     # Export local project data to Vercel KV
npm run cleanup-kv-project # Remove a project and all its data from KV
```

#### Export to KV (`export-to-kv`)

Exports epics and stories from local files to Vercel KV (Redis) storage.

**Usage:**
```bash
# Basic export (interactive epic selection)
npm run export-to-kv <project-name> --

# Dry run (preview without exporting)
npm run export-to-kv <project-name> -- --dry-run

# Export specific epics only
npm run export-to-kv <project-name> -- --epics=epic1,epic2

# Force overwrite existing stories
npm run export-to-kv <project-name> -- --force

# Create backup before exporting
npm run export-to-kv <project-name> -- --backup

# Combine options
npm run export-to-kv umami-healthcare -- --dry-run --backup --epics=revenue-cycle-management
```

**Important Notes:**
- Project name must be identical for both local files and KV storage
- The script preserves story order from local `epic.json`
- Existing stories are skipped by default (use `--force` to overwrite)
- People data is not exported (ensure it exists in KV separately)
- See `scripts/EXPORT-TO-KV.md` for detailed documentation

#### Cleanup KV Project (`cleanup-kv-project`)

Removes a project and all its data from Vercel KV storage. Useful for cleaning up old or duplicate projects.

**Usage:**
```bash
# Preview what would be deleted (dry run)
npm run cleanup-kv-project <project-name> -- --dry-run

# Actually delete the project (requires --confirm flag)
npm run cleanup-kv-project <project-name> -- --confirm
```

**What Gets Deleted:**
- Project metadata (`pm:project:<project-name>`)
- All epic metadata and lists
- All story data
- Project epics list
- Project is removed from the global projects list (without deleting the list itself)

**Safety Features:**
- `--confirm` flag is required for actual deletion (prevents accidental deletion)
- Dry run mode shows all keys that would be deleted
- The global `pm:projects:list` is preserved (only the project name is removed from it)

**Example:**
```bash
# Preview deletion
npm run cleanup-kv-project healthcare-platform -- --dry-run

# Actually delete
npm run cleanup-kv-project healthcare-platform -- --confirm
```

**Warning:** This operation is **irreversible**. Always use `--dry-run` first to review what will be deleted.

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
- [x] Epic and story templates
- [x] Bulk operations (delete, move, archive)

### Phase 3: AI Integration
- [ ] AI-powered story generation from epic
- [x] Acceptance criteria suggestions
- [ ] Technical breakdown recommendations
- [ ] Story estimation assistance

### Phase 4: Advanced Project Management
- [ ] Sprint planning and story distribution
- [ ] Timeline and Gantt chart views
- [ ] Resource planning and allocation
- [ ] Leave planning integration
- [ ] Cost estimation with hourly rates
- [ ] Budget tracking and margin calculations
- [ ] Contributor workload balancing
- [ ] Story points distribution analysis + review/justification
- [ ] Git integration (auto-update stories from commits)
- [ ] Export to other formats (CSV, PDF, Markdown)
- [ ] Import Stories from xlsx file

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
