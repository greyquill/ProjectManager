# Create Epic and Stories Script

This script automates the creation of epics and stories from a JSON input file.

## Usage

1. **Create a JSON file** following the format in `scripts/epic-story-format.json`
2. **Run the script:**
   ```bash
   npm run create-epic-stories <input-json-file>
   ```

## JSON Format

The input JSON should have this structure:

```json
{
  "projectName": "umami-healthcare",
  "epic": {
    "epicId": "RCM",
    "title": "Revenue Cycle Management (RCM) & Financial Analytics",
    "summary": "Short summary of the epic",
    "businessOverview": "Full business overview text. This becomes the epic description.",
    "technicalArchitecture": "## Technical Architecture Components\n\n- Component 1\n- Component 2",
    "implementationTimeline": "## Implementation Timeline\n\n**Week 1:**\n- Task 1",
    "caseStudyReference": "## Case Study Reference\n\n**Company Name**\n\n- **Challenge:** ..."
  },
  "stories": [
    {
      "title": "Story title",
      "requirementType": "functional",
      "category": "Category Name",
      "summary": "Optional: Story summary (auto-generated if not provided)",
      "description": "Detailed story description"
    },
    {
      "title": "Another story",
      "requirementType": "non-functional",
      "category": "Performance",
      "description": "Story description"
    }
  ],
  "manager": "person-001"
}
```

## Field Descriptions

### Epic Fields

- **`epicId`** (required): 2-6 character uppercase acronym (e.g., "RCM", "SCHED", "AI"). Used in story IDs.
- **`title`** (required): Full epic title.
- **`summary`** (required): Short summary (typically first sentence from Business Overview).
- **`businessOverview`** (required): Full business overview. This becomes the epic description.
- **`technicalArchitecture`** (optional): Markdown-formatted technical architecture section.
- **`implementationTimeline`** (optional): Markdown-formatted implementation timeline.
- **`caseStudyReference`** (optional): Markdown-formatted case study reference.

### Story Fields

- **`title`** (required): Story title.
- **`requirementType`** (required): Either `"functional"` or `"non-functional"`.
- **`category`** (required): Category/heading (e.g., "Automated Claim Management", "Performance"). Used as a tag and to prefix the summary.
- **`summary`** (optional): Story summary. If not provided, auto-generated as `"{category}: {title}"`.
- **`description`** (required): Detailed story description.

### Root Fields

- **`projectName`** (required): Project folder name (kebab-case, e.g., "umami-healthcare").
- **`manager`** (optional): Person ID for manager/owner (default: "person-001").

## What the Script Does

1. **Validates** the input JSON structure
2. **Generates** epic folder name from epic title (kebab-case)
3. **Creates** all story files with proper IDs:
   - Functional: `F-{epicId}-001`, `F-{epicId}-002`, ...
   - Non-functional: `NFR-{epicId}-001`, `NFR-{epicId}-002`, ...
4. **Creates** `epic.json` with all metadata
5. **Applies** all standard rules:
   - Business Overview → Epic Description
   - Category → Story tag and summary prefix
   - Tags: `requirementType`, `epicId`, `category`
   - Manager assigned to all stories and epic
   - Status: "todo", Priority: "medium"

## Example Workflow

1. **You provide text format** (like you've been doing)
2. **Convert to JSON** following the format above
3. **Save as** `my-epic.json`
4. **Run:** `npm run create-epic-stories my-epic.json`
5. **Update** `project.json` to add the epic to `epicIds` array
6. **Restart** dev server to see the new epic in UI

## Notes

- The script creates files in `pm/{projectName}/{epicName}/`
- Epic folder name is auto-generated from epic title (kebab-case)
- Story IDs are sequential starting from 001 for each requirement type
- All stories are created with `status: "todo"` and `priority: "medium"`
- The script does NOT update `project.json` - you need to do that manually

## Troubleshooting

- **"projectName is required"**: Make sure the JSON has a `projectName` field
- **"epic.epicId is required"**: Make sure the epic has an `epicId` field (2-6 uppercase characters)
- **"stories array is required"**: Make sure you have a `stories` array with at least one story
- **Validation errors**: Check that all required fields are present and match the expected format


