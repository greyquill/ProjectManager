# Project Management Data Directory

This directory contains all project management data in a hierarchical JSON structure.

## Structure

```
pm/
└── [project-name]/
    ├── project.json              # Project metadata
    └── [epic-name]/
        ├── epic.json             # Epic metadata
        └── STORY-*.json          # Story files
```

## Example

```
pm/
└── healthcare-platform/
    ├── project.json
    ├── patient-management/
    │   ├── epic.json
    │   ├── STORY-123.json
    │   └── STORY-124.json
    └── appointment-scheduling/
        ├── epic.json
        └── STORY-125.json
```

## File Formats

All files are JSON and follow the schemas defined in `src/lib/types.ts`:

- **project.json**: Project definition with defaults and metadata
- **epic.json**: Epic definition with metrics and story tracking
- **STORY-*.json**: Individual story files with acceptance criteria and file links

## Naming Conventions

- **Project folders**: Use kebab-case (e.g., `healthcare-platform`)
- **Epic folders**: Use kebab-case (e.g., `patient-management`)
- **Story files**: Use format `STORY-{id}.json` where id is a unique identifier

## Version Control

All files in this directory should be committed to version control. This enables:
- Full history of requirements changes
- Collaboration through Git
- Easy backup and migration
- Integration with development workflow

## Notes

- The hierarchical structure makes it easy to navigate related items
- Each project/epic/story is self-contained in its folder
- File operations are handled by the `pmRepository` module
- All data is validated using Zod schemas before writing


