# app/ - Next.js App Router

## Purpose
This directory contains all Next.js App Router pages, layouts, and API routes for the Project Manager application.

## Structure

### Pages & Routes
- **`page.tsx`** - Landing page (root `/`)
- **`layout.tsx`** - Root layout with metadata and font configuration
- **`template.tsx`** - Page transition wrapper with animations
- **`globals.css`** - Global styles and Tailwind imports

### Route Groups

#### `/projects`
- Project listing and detail pages
- Create and edit projects
- Epic overview within projects

#### `/epics`
- Epic detail pages
- Story list and metrics
- AI-powered story generation

#### `/stories`
- Story editor with metadata forms
- Acceptance criteria management
- File path linking
- Status and priority tracking

### API Routes (`/api`)

#### Projects (`/api/projects`)
- List, create, read, and update projects
- File-based JSON storage

#### Epics (`/api/epics`)
- List, create, read, and update epics
- Calculate metrics from stories

#### Stories (`/api/stories`)
- List, create, read, and update stories
- Validate with Zod schemas

## Key Patterns

### Page Components
```typescript
export default function PageName(): JSX.Element {
  return <div>...</div>
}
```

### API Routes
```typescript
export async function GET(request: Request) {
  // Read from JSON files
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  // Validate and write to JSON files
  return NextResponse.json({ success: true })
}
```

## Important Notes
- All pages use `'use client'` directive for client-side interactivity
- API routes handle file system operations through pmRepository
- Type-safe data validation with Zod schemas

