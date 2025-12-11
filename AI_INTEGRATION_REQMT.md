# AI Integration Requirements

## Overview

This document outlines the requirements for AI-powered automation across Story, Epic, and Project levels in the Project Manager application. The goal is to automate content generation, estimation, planning, and cost calculation while maintaining cost-effectiveness.

---

## 1. Story-Level AI Features

### 1.1 UI Components

**Location**: Story detail panel

**AI Buttons to Add**:
1. **Field-Specific AI Buttons**:
   - Small AI icon button next to "Description" field
   - Small AI icon button next to "Acceptance Criteria" field
   - Purpose: Generate content for that specific field

2. **General AI Button**:
   - Prominent AI button at the top of the story card
   - Purpose: Generate all story aspects at once

### 1.2 AI-Generated Content

When AI button is clicked, generate:

1. **Description**:
   - Detailed, comprehensive description based on story title and context
   - Markdown-formatted
   - Technical details where applicable
   - User stories format (As a... I want... So that...)

2. **Acceptance Criteria**:
   - Follow `.cursor/rules/acceptance_criteria_guidelines.mdc` format
   - Use Gherkin format (Given-When-Then) for functional requirements
   - Include:
     - Happy path scenario
     - Minimum 2 negative/edge case scenarios
     - Quantified, testable criteria
   - Consider epic context and related stories

3. **Start Dates** (`plannedStartDate`):
   - Based on:
     - Story priority
     - Dependencies (related stories)
     - Current project timeline
     - Resource availability (if available)
   - Format: `YYYY-MM-DD`

4. **Due Dates** (`plannedDueDate`):
   - Based on:
     - Story points estimate
     - Team velocity (if available)
     - Story complexity
     - Priority
   - Format: `YYYY-MM-DD`

5. **Story Points** (`estimate.storyPoints`):
   - Based on:
     - Description complexity
     - Acceptance criteria count
     - Requirement type (functional vs non-functional)
     - Historical data (if available)
   - Range: 0-13 (Fibonacci-like: 0, 1, 2, 3, 5, 8, 13)
   - Confidence level (`estimate.confidence`): low, medium, high

6. **Summary** (optional):
   - Brief one-sentence summary
   - Auto-generated if description exists

### 1.3 Context for AI Generation

**Input Context** (to be sent to AI):
- Story title
- Epic title and description
- Project name and description
- Related stories (if any)
- Story requirement type (functional/non-functional)
- Priority level
- Manager/assignee information
- Existing tags
- Project timeline constraints

**Output Format**:
- JSON structure matching `StorySchema`
- Only fields that can be generated (not overwriting user-entered data)
- User can accept/reject/modify generated content

---

## 2. Epic-Level AI Features

### 2.1 UI Components

**Location**: Epic detail panel

**AI Buttons**:
1. **Field-Specific AI Buttons**:
   - AI icon next to "Description" field
   - AI icon next to other relevant fields

2. **General AI Button**:
   - Prominent AI button at the top of the epic card
   - Purpose: Generate epic-level content and optimize story distribution

### 2.2 AI-Generated Content

1. **Description**:
   - Comprehensive epic description
   - Business overview
   - Technical architecture overview
   - Implementation timeline (high-level)

2. **Story Distribution**:
   - Analyze all stories in the epic
   - Suggest:
     - Story ordering/sequencing
     - Dependencies between stories
     - Story grouping by feature/module
     - Sprint allocation suggestions

3. **Epic-Level Dates**:
   - `plannedStartDate`: Earliest story start date
   - `plannedDueDate`: Latest story due date
   - Based on aggregated story dates

4. **Epic-Level Metrics**:
   - Total story points
   - Estimated completion timeline
   - Resource requirements
   - Risk assessment

5. **Story Refinement**:
   - After epic-level view, suggest adjustments to:
     - Story descriptions (for consistency)
     - Acceptance criteria (for completeness)
     - Story points (for accuracy)
     - Dates (for realistic sequencing)

### 2.3 Context for AI Generation

**Input Context**:
- Epic title and description
- All stories in the epic (titles, descriptions, acceptance criteria, story points, dates)
- Project context
- Team composition
- Historical velocity data (if available)

---

## 3. Project-Level AI Features

### 3.1 UI Components

**Location**: Project detail page

**AI Buttons**:
1. **General AI Button**:
   - Prominent AI button in project header
   - Purpose: Generate project-level planning and analysis

### 3.2 AI-Generated Content

1. **Contributors Assignment**:
   - Analyze all stories across all epics
   - Suggest optimal contributor assignments based on:
     - Story complexity
     - Skill requirements (inferred from story content)
     - Workload balancing
     - Availability (if leave planning data exists)

2. **Story Points Distribution**:
   - Analyze story points across:
     - Epics
     - Contributors
     - Time periods
   - Suggest rebalancing if needed
   - Identify bottlenecks

3. **Leave Planning Integration**:
   - Consider team member leave dates
   - Adjust story assignments and timelines
   - Identify resource gaps
   - Suggest timeline adjustments

4. **Sprint Planning**:
   - Distribute stories across sprints based on:
     - Story points capacity per sprint
     - Team velocity
     - Dependencies
     - Priority
     - Resource availability
   - Generate sprint breakdown:
     - Sprint 1: [list of stories]
     - Sprint 2: [list of stories]
     - etc.

5. **Gantt Chart Input**:
   - Generate timeline data for Gantt chart:
     - Task dependencies
     - Start/end dates
     - Resource assignments
     - Milestones
   - Format compatible with Gantt chart libraries

6. **Resource Planning**:
   - Calculate resource allocation:
     - Hours per contributor per story
     - Total hours per epic
     - Total hours per project
   - Consider:
     - Story points → hours conversion
     - Skill level adjustments
     - Buffer time for unknowns

7. **Cost Estimation**:
   - Calculate project cost based on:
     - **Hourly Rates**: Per contributor (from people data)
     - **Story Points → Hours**: Conversion factor
     - **Margin**: Expected profit margin percentage
     - **Holidays**: Non-working days
     - **Other Nuances**:
       - Overtime rates (if applicable)
       - Equipment/software costs
       - Contingency buffer
       - Tax considerations

   **Cost Breakdown**:
   - Per-story cost
   - Per-epic cost
   - Per-contributor cost
   - Total project cost
   - Cost with margin
   - Cost per story point
   - Cost per hour

### 3.3 Context for AI Generation

**Input Context**:
- All epics and stories in the project
- All contributors with:
  - Hourly rates
  - Skills/expertise
  - Leave calendar
  - Availability
- Project constraints:
  - Deadline
  - Budget constraints
  - Resource limits
- Historical data:
  - Team velocity
  - Story point → hours conversion rates
  - Actual vs estimated accuracy

---

## 4. Cost-Effective AI Solution Requirements

### 4.1 Primary Goal
**Minimize or eliminate AI API costs** while maintaining functionality.

### 4.2 Solution Options (Priority Order)

#### Option 1: Free/Open Source LLM (Preferred)
**Approach**: Use open-source LLMs that can run locally or on-premise

**Candidates**:
- **Ollama** (Local LLM runner)
  - Models: Llama 2, Mistral, CodeLlama, etc.
  - Can run on local machine or server
  - Free and open source
  - API-compatible interface
  - Can be deployed as service

- **LocalAI** (Self-hosted OpenAI-compatible API)
  - Drop-in replacement for OpenAI API
  - Supports multiple model backends
  - Can run on-premise server

- **LM Studio** (Local LLM interface)
  - User-friendly local LLM runner
  - API server mode available

**Pros**:
- ✅ Zero API costs
- ✅ Data privacy (all processing local)
- ✅ No rate limits
- ✅ Full control

**Cons**:
- ❌ Requires hardware (GPU recommended for performance)
- ❌ Setup and maintenance overhead
- ❌ May have lower quality than commercial APIs
- ❌ Model size limitations based on hardware

**Implementation**:
- Deploy Ollama/LocalAI on local machine or on-premise server
- Expose as API endpoint
- Application calls local API instead of commercial API

#### Option 2: Hybrid Approach
**Approach**: Use free tier of commercial APIs for development, local LLM for production

**Free Tier Options**:
- **Anthropic Claude** (limited free tier)
- **OpenAI** (limited free tier, may require credit card)
- **Google Gemini** (generous free tier)
- **Hugging Face Inference API** (free tier available)

**Strategy**:
- Use free tier for initial development/testing
- Migrate to local LLM for production
- Fallback to commercial API only if local LLM fails

#### Option 3: On-Premise LLM Server
**Approach**: Dedicated server with LLM running as API service

**Setup**:
- Server with GPU (or CPU if GPU unavailable)
- Run Ollama/LocalAI as service
- Expose via REST API
- Application connects to this API

**Pros**:
- ✅ Centralized, always available
- ✅ Can serve multiple users/projects
- ✅ Better hardware utilization

**Cons**:
- ❌ Requires dedicated server
- ❌ Initial hardware investment
- ❌ Maintenance and monitoring

#### Option 4: Cost-Optimized Commercial API
**Approach**: Use cheapest commercial API with smart usage patterns

**Cost-Optimization Strategies**:
- **Batch Processing**: Generate multiple items in one API call
- **Caching**: Cache similar requests
- **Selective Generation**: Only generate when explicitly requested
- **Model Selection**: Use cheaper models for simpler tasks
- **Prompt Optimization**: Shorter, more efficient prompts
- **Rate Limiting**: Prevent excessive API calls

**Cheapest Options**:
- **OpenAI GPT-3.5-turbo** (cheapest, good quality)
- **Anthropic Claude Haiku** (fast, cheap)
- **Google Gemini Pro** (competitive pricing)

**Budget Considerations**:
- Estimate API costs based on:
  - Number of stories/epics/projects
  - Average tokens per generation
  - Frequency of AI usage
  - Cost per 1K tokens

### 4.3 Recommended Architecture

**Phase 1: Development (Free Tier)**
- Use free tier of commercial API (e.g., Gemini, Claude)
- Develop and test all features
- Optimize prompts for efficiency

**Phase 2: Production (Local LLM)**
- Deploy Ollama/LocalAI on local machine or server
- Switch API endpoint to local service
- Monitor quality and adjust prompts if needed

**Phase 3: Hybrid (If Needed)**
- Keep local LLM as primary
- Fallback to commercial API for complex tasks
- User can choose which to use

---

## 5. Technical Architecture

### 5.1 API Design

**Endpoint Structure**:
```
POST /api/ai/generate-story-content
POST /api/ai/generate-epic-content
POST /api/ai/generate-project-planning
POST /api/ai/generate-acceptance-criteria
POST /api/ai/estimate-story-points
POST /api/ai/suggest-dates
POST /api/ai/sprint-planning
POST /api/ai/cost-estimation
```

**Request Format**:
```typescript
{
  type: 'story' | 'epic' | 'project' | 'acceptance-criteria' | 'story-points' | 'dates' | 'sprint' | 'cost',
  context: {
    // Story/Epic/Project data
    // Related items
    // Historical data
  },
  options: {
    fields: ['description', 'acceptanceCriteria', 'storyPoints', ...], // Which fields to generate
    model?: 'local' | 'openai' | 'claude' | 'gemini', // Override default model
  }
}
```

**Response Format**:
```typescript
{
  generated: {
    description?: string,
    acceptanceCriteria?: string[],
    storyPoints?: number,
    plannedStartDate?: string,
    plannedDueDate?: string,
    // ... other fields
  },
  confidence: 'low' | 'medium' | 'high',
  suggestions?: string[], // Additional suggestions
  model: string, // Which model was used
  cost?: number, // API cost (if applicable)
}
```

### 5.2 AI Service Layer

**Abstraction Layer**:
- `AIService` interface
- Multiple implementations:
  - `LocalAIService` (Ollama/LocalAI)
  - `OpenAIService`
  - `ClaudeService`
  - `GeminiService`
- Factory pattern to select service based on config

**Configuration**:
```typescript
// .env.local
AI_PROVIDER=local | openai | claude | gemini
AI_API_URL=http://localhost:11434  # For Ollama
AI_API_KEY=...  # For commercial APIs
AI_MODEL=llama2 | gpt-3.5-turbo | claude-3-haiku | gemini-pro
AI_FALLBACK_ENABLED=true
AI_FALLBACK_PROVIDER=openai
```

### 5.3 Prompt Engineering

**Prompt Templates**:
- Separate templates for each generation type
- Context-aware prompts
- Follow acceptance criteria guidelines
- Optimize for token efficiency

**Example Prompt Structure**:
```
You are a project management assistant. Generate [FIELD] for the following story:

Title: [TITLE]
Epic: [EPIC_TITLE]
Project: [PROJECT_NAME]
Requirement Type: [FUNCTIONAL/NON-FUNCTIONAL]
Priority: [PRIORITY]

Context:
- Related Stories: [LIST]
- Project Description: [DESCRIPTION]
- Team: [TEAM_INFO]

Guidelines:
- [SPECIFIC_GUIDELINES_FROM_RULES]

Generate [FIELD] following these requirements:
1. [REQUIREMENT_1]
2. [REQUIREMENT_2]
...

Output format: [JSON/PLAIN_TEXT]
```

---

## 6. User Experience Flow

### 6.1 Story-Level Flow

1. User creates/opens a story
2. User clicks AI button (field-specific or general)
3. Loading indicator shows progress
4. AI generates content
5. User sees preview/diff of generated content
6. User can:
   - Accept all
   - Accept selected fields
   - Reject all
   - Regenerate (with feedback)
   - Manually edit before accepting

### 6.2 Epic-Level Flow

1. User opens epic with multiple stories
2. User clicks "Generate Epic Content" or "Optimize Stories"
3. AI analyzes all stories
4. AI suggests:
   - Epic description improvements
   - Story refinements
   - Story sequencing
   - Date adjustments
5. User reviews suggestions
6. User accepts/rejects/modifies suggestions
7. Changes applied to stories

### 6.3 Project-Level Flow

1. User opens project
2. User clicks "AI Project Planning"
3. AI analyzes entire project
4. AI generates:
   - Contributor assignments
   - Sprint plan
   - Gantt chart data
   - Resource plan
   - Cost estimate
5. User reviews each section
6. User accepts/rejects/modifies
7. Changes applied to project, epics, and stories

---

## 7. Data Requirements

### 7.1 People Data Enhancement

**Additional Fields Needed**:
```typescript
{
  id: string,
  name: string,
  email: string,
  designation: string,
  roleInProject: string,
  // NEW FIELDS:
  hourlyRate: number,        // For cost estimation
  skills: string[],          // For assignment suggestions
  availability: {            // For resource planning
    startDate: string,
    endDate: string,
    hoursPerWeek: number,
  },
  leaveCalendar: {           // For leave planning
    dates: string[],         // Array of leave dates (YYYY-MM-DD)
  },
  capacity: {                // For workload balancing
    storyPointsPerSprint: number,
    hoursPerSprint: number,
  }
}
```

### 7.2 Project Data Enhancement

**Additional Fields Needed**:
```typescript
{
  // Existing fields...
  // NEW FIELDS:
  pricing: {
    margin: number,          // Profit margin percentage
    contingency: number,    // Contingency buffer percentage
    taxRate: number,         // Tax rate percentage
  },
  constraints: {
    deadline: string,        // Project deadline
    budget: number,          // Budget limit
    maxResources: number,    // Maximum team size
  },
  settings: {
    storyPointToHours: number,  // Conversion factor (e.g., 1 SP = 4 hours)
    sprintLength: number,       // Sprint length in days
    workingDaysPerWeek: number, // e.g., 5
    hoursPerDay: number,        // e.g., 8
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Story-Level AI (MVP)
- [ ] AI button UI components
- [ ] API endpoint for story content generation
- [ ] AI service abstraction layer
- [ ] Local LLM integration (Ollama)
- [ ] Description generation
- [ ] Acceptance criteria generation
- [ ] Story points estimation
- [ ] Date suggestion

### Phase 2: Epic-Level AI
- [ ] Epic AI button
- [ ] Epic content generation
- [ ] Story analysis and optimization
- [ ] Story sequencing suggestions
- [ ] Epic-level date calculation

### Phase 3: Project-Level AI - Planning
- [ ] Project AI button
- [ ] Contributor assignment suggestions
- [ ] Story points distribution analysis
- [ ] Sprint planning generation
- [ ] Gantt chart data generation

### Phase 4: Project-Level AI - Resource & Cost
- [ ] Leave planning integration
- [ ] Resource planning
- [ ] Cost estimation
- [ ] Cost breakdown visualization
- [ ] Budget tracking

### Phase 5: Optimization & Polish
- [ ] Prompt optimization
- [ ] Caching layer
- [ ] Batch processing
- [ ] Quality improvements
- [ ] User feedback loop

---

## 9. Success Criteria

### 9.1 Functional Requirements
- ✅ AI can generate accurate, useful content for all specified fields
- ✅ Generated content follows project guidelines (acceptance criteria format, etc.)
- ✅ User can accept/reject/modify generated content easily
- ✅ Cost estimation is accurate within 10% margin
- ✅ Sprint planning is realistic and considers dependencies

### 9.2 Non-Functional Requirements
- ✅ AI response time < 5 seconds for story-level
- ✅ AI response time < 30 seconds for project-level
- ✅ Zero or minimal API costs (prefer local LLM)
- ✅ Works offline (if using local LLM)
- ✅ Data privacy maintained (no data sent to external APIs if using local LLM)

### 9.3 Quality Requirements
- ✅ Generated acceptance criteria are testable and follow Gherkin format
- ✅ Story points are reasonable (within 1-2 points of human estimate)
- ✅ Dates are realistic and consider dependencies
- ✅ Cost estimates are within acceptable variance

---

## 10. Open Questions & Decisions Needed

1. **AI Provider Selection**:
   - Which local LLM to use? (Ollama recommended)
   - Fallback to commercial API? Which one?
   - Model selection for different tasks?

2. **Hardware Requirements**:
   - Minimum hardware for local LLM?
   - GPU required or CPU sufficient?
   - Server deployment or local machine?

3. **Cost Estimation Formula**:
   - Story points → hours conversion factor?
   - How to account for skill level differences?
   - How to handle overtime/premium rates?

4. **User Interface**:
   - How to display AI suggestions? (Side-by-side diff? Modal? Inline?)
   - How to handle partial acceptance?
   - How to show AI confidence levels?

5. **Data Privacy**:
   - If using commercial API, what data can be sent?
   - Do we need data anonymization?
   - User consent for AI processing?

6. **Quality Assurance**:
   - How to validate AI-generated content?
   - User feedback mechanism?
   - Quality metrics tracking?

---

## 11. Next Steps

1. **Review & Approve Requirements**: Review this document and approve the approach
2. **AI Provider Decision**: Decide on local LLM vs commercial API
3. **Architecture Design**: Detailed technical architecture for AI integration
4. **Prototype**: Build MVP for story-level AI generation
5. **Testing**: Test with real project data
6. **Iteration**: Refine based on feedback

---

**Document Status**: Draft - Awaiting Review and Approval
**Last Updated**: 2025-01-15
**Owner**: Development Team

