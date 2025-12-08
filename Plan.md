# 7. Standalone AI-Native Project Management Tool

### 7.1 Goal & Philosophy

This project management tool is:

* **File-based and type-safe**: Every epic and story is a JSON file checked into the repo.
* **AI-native**: Cursor’s AI is used to:

  * Expand an epic into multiple stories
  * Add or refine acceptance criteria
  * Suggest file paths / technical breakdown
* **Simple but powerful**: The UI is just a clean editor on top of the JSON, with:

  * Inline forms for metadata
  * A text/markdown panel for descriptions
  * Status tracking
* **Dev-first**: Everything lives next to the code, editable in the same repo. The UI is just a better interface over those JSON files.

---

## 7.2 Core Data Model (JSON Definitions)

At the heart of this tool is the JSON schema. Think of three main entities:

* **Project**
* **Epic**
* **Story**

You can start simple and extend later.

### 7.2.1 Story JSON

A **Story** is the smallest unit of work.
Each story is one JSON file, e.g. `STORY-123.json`.

**Fields (first version):**

```jsonc
{
  "id": "STORY-123",              // unique ID
  "epicId": "EPIC-1",             // link back to epic

  "title": "Implement patient creation form",
  "summary": "As a user, I can create a new patient profile with basic demographics.",
  "description": "Longer markdown description if needed.",
  "acceptanceCriteria": [
    "User can fill first name, last name, DOB, gender",
    "Form validates required fields",
    "On success, patient appears in patients list"
  ],

  "status": "todo",               // todo | in_progress | blocked | done | archived
  "priority": "medium",           // low | medium | high | critical

  "assignee": "unassigned",       // or user id / email
  "createdAt": "2025-01-05T10:00:00Z",
  "updatedAt": "2025-01-05T10:00:00Z",
  "dueDate": null,

  "tags": ["frontend", "patients"],
  "estimate": {
    "storyPoints": 3,
    "confidence": "medium"        // optional
  },

  "relatedStories": [],           // ["STORY-122", "STORY-130"]
  "mentions": [],                 // later: references to files, modules, people

  "files": [
    {
      "path": "apps/web/app/patients/new/page.tsx",
      "role": "primary"           // primary | supporting | test
    }
  ],

  "metadata": {
    "createdBy": "you",
    "lastEditedBy": "you",
    "custom": {}
  }
}
```

This is your **“story definition”** with all the metadata you mentioned:

* status
* dates
* assignee
* tags
* links to code

> The UI will **edit this JSON**, and the server will just read/write these files.

---

### 7.2.2 Epic JSON

An **Epic** groups multiple stories and gives a higher-level view.

Each epic is one file, e.g. `EPIC-1.json`.

```jsonc
{
  "id": "EPIC-1",
  "projectId": "PROJ-HEALTH",

  "title": "Patient Management Module",
  "summary": "Implement end-to-end patient registration, listing, and management.",
  "description": "Markdown description of the epic, goals, constraints, notes.",

  "status": "in_progress",        // todo | in_progress | done | archived
  "priority": "high",

  "assignee": "you",
  "createdAt": "2025-01-05T09:00:00Z",
  "updatedAt": "2025-01-05T11:00:00Z",
  "targetRelease": "2025-02-15",

  "storyIds": ["STORY-123", "STORY-124", "STORY-125"],

  "metrics": {
    "totalStoryPoints": 13,
    "completedStoryPoints": 5
  },

  "metadata": {
    "createdBy": "you",
    "custom": {}
  }
}
```

The **tracker** will primarily operate around:

* Epic -> its stories
* Epic-level status and metrics

---

### 7.2.3 Project JSON

A **Project** defines a product or large initiative.

```jsonc
{
  "id": "PROJ-HEALTH",
  "name": "Healthcare Workflow Platform",
  "description": "Overall platform for hospital, patient, and workflow management.",

  "epicIds": ["EPIC-1", "EPIC-2"],

  "defaultStatuses": ["todo", "in_progress", "blocked", "done"],
  "defaultPriorities": ["low", "medium", "high", "critical"],

  "metadata": {
    "owner": "you",
    "repoUrl": "git@github.com:you/health-platform.git"
  }
}
```

You don’t need to overcomplicate this initially. Just enough to:

* Group epics
* Provide project-level defaults

---

## 7.3 File Layout in the Repo

A simple, clean structure:

```text
/project-root
  /pm                          # project management system data
    /projects
      PROJ-HEALTH.json
    /epics
      EPIC-1.json
      EPIC-2.json
    /stories
      STORY-123.json
      STORY-124.json
      STORY-125.json

  /apps
    /web                       # your Next.js app
      ...
```

This aligns nicely with:

* Cursor reading files directly
* Git tracking all changes to stories/epics
* Your Next.js app acting as a UI over `/pm/...`

---

## 7.4 Next.js Application Architecture

Assuming “next year's application” = **Next.js app**.

### 7.4.1 High-Level Structure

* **App Routes / Pages**

  * `/projects` – list projects
  * `/projects/[projectId]` – see epics
  * `/epics/[epicId]` – see epic + stories
  * `/stories/[storyId]` – edit a story

* **API Routes**

  * `GET /api/projects`, `GET /api/projects/[id]`
  * `GET /api/epics/[id]`, `POST /api/epics`, `PUT /api/epics/[id]`
  * `GET /api/stories/[id]`, `POST /api/stories`, `PUT /api/stories/[id]`
  * All of these just read/write JSON files under `/pm`.

* **Data Layer**

  * Simple file-based storage using Node’s `fs`:

    * `readStory(id)` -> loads `/pm/stories/STORY-123.json`
    * `writeStory(id, data)` -> overwrites the same file
  * You can wrap this in a small `pmRepository.ts` module.

---

### 7.4.2 The UI for a Story

On `/stories/[storyId]`, you’d have:

* **Left panel**: Story metadata form

  * Title, Status, Priority, Assignee, Tags
  * Dates (created, due, etc.)

* **Center panel**: Text/markdown editor

  * Summary
  * Description
  * Acceptance criteria (list editor)

* **Right panel** (optional): AI helper

  * Buttons like:

    * “Generate acceptance criteria from summary”
    * “Break this story into subtasks”
    * “Suggest code file paths”

All changes map directly to the JSON structure and are saved via your API.

---

### 7.4.3 The UI for an Epic

On `/epics/[epicId]`:

* Top: Epic metadata (title, description, status, assignee, target release)
* Middle: Table/list of stories with:

  * Title
  * Status
  * Assignee
  * Story points
* Side / Top-right: AI helper for:

  * “Generate stories from this epic description”
  * “Regroup stories by module”
  * “Suggest missing stories”

When you click **“Generate stories”**, the flow could be:

1. You enter an **epic description** and maybe bullet points of what it should include.
2. You call Cursor’s AI (through Cursor’s interface or an API if available) with a prompt like:

   * “Break this epic into N stories, each with title, summary, acceptanceCriteria.”
3. You get back a JSON-like structure.
4. The Next.js app:

   * Creates new `STORY-XXX.json` files
   * Updates the `EPIC-1.json` `storyIds` list

---

## 7.5 Tracker Behavior (Epic + Stories → Definition)

You said:

> “The tracker should simply take an input of an epic and the stories and be able to define what it should be.”

Here’s a concrete way to do that:

### 7.5.1 Input

User provides in the UI:

* **Epic title**
* **Epic description** (free-form text)
* Optionally:

  * Number of stories desired
  * Rough modules or constraints

### 7.5.2 AI Expansion

The app (or you via Cursor) will:

1. Send a prompt: “Given this epic, generate N stories…”
2. Receive structured output for each story:

   * title
   * summary
   * acceptanceCriteria
   * maybe suggested tags or file paths

### 7.5.3 JSON Generation

Your server then:

* Creates `EPIC-<N>.json` with:

  * Title, description, default metadata
* For each AI-generated story:

  * Allocates an ID: `STORY-<timestamp-counter>`
  * Writes one JSON file per story under `/pm/stories`
* Updates the epic’s `storyIds` array
* Optionally computes `totalStoryPoints` if AI suggests them.

Now, the tracker view for an epic can show:

* **Epic progress**:

  * # stories done / total
  * Story points done / total
* **Timeline**:

  * Created, updated, target release
* **Status breakdown**:

  * stories by status

And you haven’t touched a traditional PM tool.

---

## 7.6 Server-Side Story Creation Flow

You also mentioned:

> “There could be a server running to manipulate the data and once the JSON is done that is what will be a story.”

That maps nicely to:

1. Next.js API route as the “server”
2. API endpoint like: `POST /api/stories/generate-from-epic`
3. Body:

   ```json
   {
     "epicId": "EPIC-1",
     "epicDescription": "...",
     "numStories": 5
   }
   ```
4. Handler:

   * Calls AI (or expects Cursor to paste result for now)
   * Generates JSON files
   * Returns the created story IDs

From then on, **the JSON itself is the story**, and your UI just surfaces it.

---

## 7.7 How You Can Use This With Cursor

Concrete ways this design works beautifully with Cursor:

* Cursor can **read `/pm/stories/*.json`** and understand:

  * What’s planned
  * What files are linked to which stories
* You can:

  * Open a story JSON file in Cursor
  * Ask Cursor: “Implement this story in the mentioned files.”
* After implementation:

  * Update the story’s `status` to `done` via the UI
  * Or even through a script that reads commit messages and updates JSON.

Over time, you could automate:

* “Find all stories linked to changed files in this PR and ask Cursor to summarize what was completed.”

---

## 7.8 Suggested First Implementation Steps

If you want a practical starting path:

1. **Define schemas**

   * Lock in `Story`, `Epic`, `Project` JSON fields.
2. **Create `/pm` folder**

   * Add 1 project, 1 epic, 2–3 stories as examples.
3. **Scaffold Next.js app**

   * Basic pages for listing and editing stories/epics.
4. **Implement file-based API layer**

   * `GET/PUT` for individual stories and epics.
5. **Build story editor UI**

   * Form for metadata, textarea for descriptions, list editor for acceptance criteria.
6. **Add “Generate Stories” button on epic page**

   * For now, just paste AI output manually into a modal and let the app write JSON.
   * Later, integrate directly with an AI API if/when you want.

