# lib/ - Utilities and Services

## Purpose
This directory contains utility functions, type definitions, and service modules for the Project Manager application.

## Key Files

### `types.ts`
TypeScript type definitions and Zod schemas for:
- **Story**: Complete story schema with all fields (status, priority, acceptance criteria, files, etc.)
- **Epic**: Epic schema with metrics and story tracking
- **Project**: Project schema with defaults and metadata
- **Helper Functions**:
  - `parseStory()`, `parseEpic()`, `parseProject()` - Validation and parsing
  - `createStory()`, `createEpic()`, `createProject()` - Factory functions with defaults
  - `generateStoryId()`, `generateTimestamp()` - ID and timestamp generation

All schemas use Zod for runtime validation and TypeScript type inference.

### `pm-repository.ts`
File-based data layer for reading and writing JSON files in hierarchical structure:
- `readProject(projectName)` - Load project JSON
- `writeProject(projectName, data)` - Save project JSON
- `readEpic(projectName, epicName)` - Load epic JSON
- `writeEpic(projectName, epicName, data)` - Save epic JSON
- `readStory(projectName, epicName, storyId)` - Load story JSON
- `writeStory(projectName, epicName, storyId, data)` - Save story JSON
- `listProjects()` - Get all projects
- `listEpics(projectName)` - Get epics for a project
- `listStories(projectName, epicName)` - Get stories for an epic
- `createProjectDir(projectName)` - Create project directory
- `createEpicDir(projectName, epicName)` - Create epic directory

### `utils.ts`
Helper functions:
- Date formatting
- String manipulation
- ID generation
- Status and priority helpers

## File System Operations

All data is stored in the `/pm` directory:
```
/pm
  /projects
    PROJ-*.json
  /epics
    EPIC-*.json
  /stories
    STORY-*.json
```

## Important Notes
- All file operations are asynchronous
- Atomic writes prevent data corruption
- JSON validation with Zod schemas
- Error handling with user-friendly messages

