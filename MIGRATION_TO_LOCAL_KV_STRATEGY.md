# Migration Strategy: File-Based Storage → Local KV Storage

## Executive Summary

This document outlines the strategy for migrating from file-based JSON storage (`/pm` directory) to local KV (Redis) storage for development, using the **exact same Upstash Redis REST API client** as production. This ensures zero changes to production/Vercel deployment while providing a unified storage backend for local development.

**Goal**: Use local Redis for development (via REST API proxy to match Vercel's Upstash setup), migrate all data from `/pm` to local KV, then rename `/pm` to `/pm-backup` for safekeeping.

**Key Requirements:**
- ✅ **Zero production changes** - Vercel deployment works exactly as before
- ✅ **Closest local match** - Use same `@upstash/redis` client with REST API
- ✅ **Preserve data** - Rename `/pm` to `/pm-backup` (not delete)

**Status**: Strategy Document - Ready for Implementation

---

## Key Requirements & Constraints

### ✅ Must-Have Requirements

1. **Zero Production Changes**
   - No code changes that affect Vercel deployment
   - Production continues using Upstash Redis exactly as before
   - No environment variable changes in Vercel
   - No deployment configuration changes

2. **Closest Local Match to Vercel**
   - Use same `@upstash/redis` client library
   - Use REST API format (same as Upstash)
   - Point to local REST API proxy instead of cloud
   - Minimal code changes (only local dev detection)

3. **Preserve Data**
   - Rename `/pm` to `/pm-backup` (not delete)
   - Keep all files intact for reference
   - Maintain Git history

### 🎯 Solution Approach

**Local Development:**
- Use `@upstash/redis` client (same as production)
- Point `UPSTASH_REDIS_REST_URL` to local REST API proxy (`http://localhost:8080`)
- Local proxy translates REST API calls to Redis commands
- Docker Compose runs Redis + proxy

**Production (Vercel):**
- Unchanged - continues using Upstash Redis cloud
- Same client, same code path
- Zero modifications needed

**Result:**
- Same codebase works in both environments
- Only environment variables differ
- Production deployment unaffected

---

## Current Architecture Analysis

### Current State

**File-Based Storage (Development)**
- Location: `/pm` directory in project root
- Structure: Hierarchical JSON files
  ```
  pm/
  ├── people.json
  └── [project-name]/
      ├── project.json
      └── [epic-name]/
          ├── epic.json
          └── STORY-*.json
  ```
- Repository: `src/lib/pm-repository.ts`
- Detection: Uses files when `NODE_ENV=development` or `ENVIRONMENT=DEV`

**KV Storage (Production)**
- Backend: Upstash Redis (Marketplace) or Vercel KV (legacy)
- Repository: `src/lib/pm-repository-kv.ts`
- Detection: Uses KV when `VERCEL=1` or `ENVIRONMENT=PROD`
- Key Structure:
  - `pm:project:[project-name]` - Project data
  - `pm:epic:[project-name]:[epic-name]` - Epic data
  - `pm:story:[project-name]:[epic-name]:[story-id]` - Story data
  - `pm:projects:list` - Global projects list
  - `pm:people:global` - Global people data

**Router Logic**
- `pm-repository.ts` acts as a router
- Checks `USE_KV` flag to determine backend
- Falls back to files if KV unavailable

### Data Volume Estimate

Based on `/pm/umami-healthcare/`:
- **Projects**: 1 (umami-healthcare)
- **Epics**: ~15 epics
- **Stories**: ~500+ stories (estimated from directory listing)
- **People**: Global people.json file
- **Total Keys**: ~520+ KV keys

---

## Local KV Solution: Upstash Redis REST API Proxy (Recommended) ⭐

### Why This Approach?

**Production uses:** `@upstash/redis` client with REST API (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)

**To match production exactly:**
- Use the **same `@upstash/redis` client** in local development
- Point it to a **local REST API proxy** that wraps a local Redis instance
- This ensures **zero code changes** needed for production

### Architecture

```
Local Development:
┌─────────────┐     HTTP REST API     ┌──────────────┐     Redis Protocol    ┌──────────┐
│   Next.js   │ ───────────────────> │ REST API     │ ───────────────────> │  Redis   │
│   App       │                       │ Proxy        │                      │ (Docker) │
│             │ <───────────────────  │ (Port 8080)  │ <──────────────────  │ (6379)   │
└─────────────┘                       └──────────────┘                      └──────────┘
     │
     │ Uses @upstash/redis client
     │ UPSTASH_REDIS_REST_URL=http://localhost:8080
     │ UPSTASH_REDIS_REST_TOKEN=local-dev-token
     │
     │
Production (Vercel):
┌─────────────┐     HTTPS REST API    ┌──────────────┐
│   Next.js   │ ───────────────────> │  Upstash     │
│   App       │                       │  Redis API   │
│             │ <───────────────────  │  (Cloud)     │
└─────────────┘                       └──────────────┘
     │
     │ Uses @upstash/redis client (same!)
     │ UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
     │ UPSTASH_REDIS_REST_TOKEN=xxx
```

### Implementation: Local Redis + REST API Proxy

**Option A: Use Existing Proxy (Recommended)**

Use `upstash-redis-proxy` or similar package that provides REST API for local Redis:

```bash
npm install --save-dev upstash-redis-proxy
```

**Docker Compose Setup:**
```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis-proxy:
    image: upstash/redis-proxy:latest  # Or use custom proxy
    ports:
      - "8080:8080"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PORT=8080
    depends_on:
      - redis

volumes:
  redis-data:
```

**Option B: Simple Custom Proxy (If needed)**

Create a minimal Express server that translates Upstash REST API calls to Redis commands:

```typescript
// scripts/redis-proxy.ts (development only)
import express from 'express'
import { createClient } from 'redis'

const app = express()
const redis = createClient({ url: 'redis://localhost:6379' })

app.use(express.json())

// Translate Upstash REST API format to Redis commands
app.post('/pipeline', async (req, res) => {
  // Handle Upstash pipeline format
  // Translate to Redis commands
})

app.listen(8080)
```

### Environment Variables

**Local Development (.env.local):**
```bash
# Local Redis REST API Proxy
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token-any-value

# Environment detection (unchanged - production logic stays the same)
ENVIRONMENT=DEV
NODE_ENV=development
```

**Production (Vercel - unchanged):**
```bash
# Upstash Redis (set by Vercel Marketplace)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Environment detection (unchanged)
VERCEL=1
ENVIRONMENT=PROD
```

### Benefits

- ✅ **Zero production changes** - Same client, same code path
- ✅ **Exact match** - Uses same REST API format as Upstash
- ✅ **Simple setup** - Docker Compose handles everything
- ✅ **Easy debugging** - Can inspect Redis directly
- ✅ **No code modifications** - Only environment variables change

### Alternative: Direct Redis (If REST API proxy unavailable)

If no suitable REST API proxy exists, we can:
1. Keep production code unchanged (uses `@upstash/redis`)
2. Add local-only code path that uses `ioredis` for direct connection
3. Detection: Only use direct connection when `UPSTASH_REDIS_REST_URL` points to localhost

**This requires minimal code change:**
```typescript
// Only in pm-repository-kv.ts - local dev only
function getKVClient() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const isLocal = restUrl?.startsWith('http://localhost')

  if (isLocal && process.env.NODE_ENV === 'development') {
    // Local: Use direct Redis connection
    const Redis = require('ioredis')
    return new Redis({ host: 'localhost', port: 6379 })
  }

  // Production: Use Upstash REST API (unchanged)
  return getUpstashClient() // existing logic
}
```

**Recommendation**: Try REST API proxy first (Option A), fallback to direct connection (Alternative) if needed.

---

## Migration Strategy

### Phase 1: Setup Local KV Infrastructure

**Objective**: Get local Redis running and accessible

**Tasks:**
1. **Create Docker Compose Setup**
   - Add `docker-compose.yml` for local Redis
   - Configure Redis with persistence
   - Add RedisInsight (optional, for debugging)

2. **Setup Local Redis + REST API Proxy**
   - Create `docker-compose.yml` with Redis + proxy
   - Or use existing `upstash-redis-proxy` package
   - Ensure proxy translates Upstash REST API format to Redis commands

3. **Environment Configuration (No Code Changes!)**
   - **Local (.env.local)**: Point `UPSTASH_REDIS_REST_URL` to local proxy
   - **Production (Vercel)**: Unchanged - uses Upstash cloud
   - **Detection logic**: Unchanged - `VERCEL=1` still triggers KV mode
   - **Local override**: Set `UPSTASH_REDIS_REST_URL=http://localhost:8080` in `.env.local`

   **Key Insight**: The existing `pm-repository.ts` detection logic works perfectly:
   ```typescript
   // Current logic (unchanged):
   const USE_KV = (process.env.ENVIRONMENT === 'PROD' || process.env.VERCEL === '1') &&
                  process.env.ENVIRONMENT !== 'DEV' &&
                  process.env.NODE_ENV !== 'development'

   // For local KV, we'll set environment to use KV:
   // Option 1: Set ENVIRONMENT=LOCAL (not DEV, not PROD)
   // Option 2: Override detection for local dev with env var
   ```

   **Better approach**: Add minimal local override that doesn't affect production:
   ```typescript
   // Only add this check - production path unchanged
   const USE_KV =
     (process.env.ENVIRONMENT === 'PROD' || process.env.VERCEL === '1') ||
     (process.env.USE_LOCAL_KV === 'true') // New: local override
   ```

   **Or even simpler**: Just set `UPSTASH_REDIS_REST_URL` in `.env.local` and the existing `@upstash/redis` client will connect to local proxy automatically. The detection logic can stay as-is if we're okay with local using files OR we add the minimal override above.

4. **Create Development Scripts**
   - `npm run redis:start` - Start local Redis
   - `npm run redis:stop` - Stop local Redis
   - `npm run redis:status` - Check Redis status
   - `npm run redis:flush` - Clear all data (for testing)

**Deliverables:**
- ✅ `docker-compose.yml`
- ✅ Updated repository detection logic
- ✅ Local Redis connection support
- ✅ Development scripts

**Testing:**
- ✅ Verify local Redis starts/stops correctly
- ✅ Verify application can connect to local Redis
- ✅ Verify data persists across restarts

---

### Phase 2: Data Migration Tool

**Objective**: Create comprehensive migration tool to move data from `/pm` to local KV

**Tasks:**
1. **Create Migration Script**
   - `scripts/migrate-to-local-kv.ts`
   - Reads all data from `/pm` directory
   - Writes to local KV using same key structure as production
   - Validates data integrity during migration

2. **Migration Features**
   - **Dry-run mode**: Preview what would be migrated
   - **Incremental migration**: Migrate one project at a time
   - **Validation**: Compare file data vs KV data
   - **Backup**: Create backup of `/pm` before migration
   - **Rollback**: Ability to restore from backup
   - **Progress tracking**: Show migration progress
   - **Error handling**: Handle missing files, invalid JSON, etc.

3. **Data Validation**
   - Verify all projects migrated
   - Verify all epics migrated
   - Verify all stories migrated
   - Verify people data migrated
   - Compare counts (file count vs KV key count)
   - Spot-check random items for data integrity

4. **Migration Report**
   - Summary of migrated items
   - List of errors/warnings
   - Data validation results
   - Recommendations

**Script Structure:**
```typescript
// scripts/migrate-to-local-kv.ts
interface MigrationOptions {
  dryRun: boolean
  project?: string  // Migrate specific project only
  backup: boolean
  validate: boolean
  force: boolean  // Overwrite existing KV data
}

async function migrateToLocalKV(options: MigrationOptions) {
  // 1. Validate local KV is available
  // 2. Create backup if requested
  // 3. Read all data from /pm
  // 4. Write to local KV
  // 5. Validate migration
  // 6. Generate report
}
```

**Deliverables:**
- ✅ Migration script
- ✅ Validation tools
- ✅ Backup/restore functionality
- ✅ Migration documentation

**Testing:**
- ✅ Test with small project first
- ✅ Test with full umami-healthcare project
- ✅ Test error scenarios (missing files, invalid JSON)
- ✅ Test rollback functionality

---

### Phase 3: Parallel Operation (Dual Write)

**Objective**: Support both file and KV storage simultaneously during transition

**Tasks:**
1. **Update Repository Layer**
   - Modify `pm-repository.ts` to support dual-write mode
   - When `DUAL_WRITE=true`, write to both file and KV
   - Read from KV (primary), fallback to files if KV missing

2. **Dual Write Logic**
   ```typescript
   async function writeProject(projectName: string, project: Project) {
     if (DUAL_WRITE) {
       // Write to both
       await Promise.all([
         writeToFiles(projectName, project),
         writeToKV(projectName, project)
       ])
     } else if (USE_KV) {
       await writeToKV(projectName, project)
     } else {
       await writeToFiles(projectName, project)
     }
   }
   ```

3. **Read Strategy**
   - Primary: Read from KV
   - Fallback: Read from files if KV key doesn't exist
   - Log when fallback occurs (for monitoring)

4. **Validation Mode**
   - Compare reads from both sources
   - Log discrepancies
   - Generate comparison report

**Deliverables:**
- ✅ Dual-write support
- ✅ Fallback read logic
- ✅ Validation/comparison tools

**Testing:**
- ✅ Verify writes go to both sources
- ✅ Verify reads prefer KV
- ✅ Verify fallback works
- ✅ Test with real usage for 1-2 weeks

---

### Phase 4: Full Migration & Validation

**Objective**: Complete migration and validate all data

**Tasks:**
1. **Run Full Migration**
   - Execute migration script for all projects
   - Validate all data migrated correctly
   - Generate migration report

2. **Data Integrity Checks**
   - Count verification (projects, epics, stories, people)
   - Random sampling validation
   - Full data comparison (file vs KV)
   - Test all CRUD operations

3. **User Acceptance Testing**
   - Test all UI features work with KV
   - Test analytics dashboard
   - Test search/filtering
   - Test bulk operations
   - Performance testing

4. **Fix Any Issues**
   - Address data discrepancies
   - Fix any bugs discovered
   - Re-run migration if needed

**Deliverables:**
- ✅ All data migrated
- ✅ Validation report
- ✅ UAT sign-off

**Testing:**
- ✅ Full feature testing
- ✅ Performance testing
- ✅ Data integrity verification

---

### Phase 5: Switch to KV-Only Mode

**Objective**: Remove file-based storage dependency

**Tasks:**
1. **Update Environment Configuration**
   - Set `USE_LOCAL_KV=true` by default for development
   - Remove file-based fallback logic
   - Update documentation

2. **Remove Dual Write**
   - Remove `DUAL_WRITE` mode
   - Simplify repository layer
   - Remove file system code paths

3. **Update Scripts**
   - Remove file-based export scripts (or mark as deprecated)
   - Update import scripts to use KV
   - Update documentation

4. **Clean Up**
   - Remove unused file system functions
   - Remove file-based repository code
   - Update type definitions if needed

**Deliverables:**
- ✅ KV-only mode
- ✅ Cleaned up codebase
- ✅ Updated documentation

**Testing:**
- ✅ Verify no file system dependencies remain
- ✅ Full regression testing
- ✅ Performance verification

---

### Phase 6: Archive File Storage (Not Delete)

**Objective**: Rename `/pm` to `/pm-backup` for safekeeping

**Tasks:**
1. **Final Validation**
   - Verify all data successfully migrated
   - Confirm no data loss
   - Validate all features work with KV

2. **Rename Directory**
   - Rename `/pm` to `/pm-backup`
   - Keep all files intact for reference
   - Document the rename in Git commit

3. **Update Code References**
   - Update `PM_DATA_DIR` constant to point to `pm-backup` (if any code still references it)
   - Or remove file system code entirely if not needed
   - Update `.gitignore` if needed

4. **Update Documentation**
   - Update README.md to reflect KV-only storage
   - Update VERCEL_KV_SETUP.md
   - Document that `/pm-backup` is archive (not active)
   - Create migration guide for future reference

5. **Keep File System Code (Optional)**
   - **Decision**: Keep file system code for potential future use or remove?
   - If keeping: Mark as deprecated, add comments
   - If removing: Delete file-based repository functions, clean up imports

**Deliverables:**
- ✅ `/pm` renamed to `/pm-backup`
- ✅ Documentation updated
- ✅ Code cleaned up (or marked deprecated)

**Testing:**
- ✅ Verify application works without `/pm` directory
- ✅ Verify `/pm-backup` exists and is intact
- ✅ Full system test

---

## Risk Assessment & Mitigation

### High Risk

**Risk 1: Data Loss During Migration**
- **Impact**: Critical - Loss of project data
- **Probability**: Low
- **Mitigation**:
  - Create backups before migration
  - Test migration on copy of data first
  - Validate data integrity after migration
  - Keep `/pm` directory until migration verified
  - Implement rollback mechanism

**Risk 2: Performance Issues with Local KV**
- **Impact**: Medium - Slow development experience
- **Probability**: Medium
- **Mitigation**:
  - Benchmark local Redis performance
  - Optimize queries if needed
  - Use Redis persistence appropriately
  - Monitor performance during testing

**Risk 3: Production KV Connection Issues**
- **Impact**: High - Production downtime
- **Probability**: Low
- **Mitigation**:
  - Keep production KV separate from local
  - Test environment detection thoroughly
  - Use different environment variables
  - Add monitoring/alerts

### Medium Risk

**Risk 4: Migration Script Bugs**
- **Impact**: Medium - Incorrect data migration
- **Probability**: Medium
- **Mitigation**:
  - Extensive testing with sample data
  - Dry-run mode for validation
  - Data validation after migration
  - Incremental migration (one project at a time)

**Risk 5: Developer Onboarding Complexity**
- **Impact**: Low - New developers need Docker
- **Probability**: High
- **Mitigation**:
  - Clear setup documentation
  - Docker Compose simplifies setup
  - Provide setup script
  - Document troubleshooting

### Low Risk

**Risk 6: Git History Loss**
- **Impact**: Low - Loss of version history
- **Probability**: Low
- **Mitigation**:
  - Keep `/pm` in Git history
  - Archive `/pm` before deletion
  - Document migration in Git

---

## Testing Strategy

### Unit Tests
- Test repository layer with local KV
- Test migration script functions
- Test data validation functions
- Test dual-write logic

### Integration Tests
- Test full CRUD operations with local KV
- Test migration script end-to-end
- Test fallback mechanisms
- Test data integrity

### Manual Testing
- Test all UI features with local KV
- Test analytics dashboard
- Test bulk operations
- Test performance with large datasets

### Performance Testing
- Benchmark read/write operations
- Compare file vs KV performance
- Test with large projects (500+ stories)
- Test concurrent operations

### Data Validation
- Compare file data vs KV data
- Verify all keys created correctly
- Verify data types preserved
- Verify relationships maintained

---

## Rollback Plan

### Rollback Triggers
- Data loss detected
- Performance degradation
- Critical bugs discovered
- User acceptance testing failures

### Rollback Procedure

**Phase 1-2 Rollback:**
- Stop using local KV
- Revert to file-based storage
- No data loss (files still exist)

**Phase 3 Rollback:**
- Disable dual-write
- Revert to file-only mode
- Data in KV can be ignored

**Phase 4-5 Rollback:**
- Restore `/pm` from backup
- Revert code changes
- Re-enable file-based storage
- Re-run migration if needed

**Phase 6 Rollback:**
- Restore `/pm` from archive
- Revert code changes
- Re-enable file-based storage

### Rollback Testing
- Test rollback procedure
- Verify data integrity after rollback
- Document rollback steps

---

## Implementation Timeline

### Estimated Timeline

**Phase 1: Setup Local KV Infrastructure**
- Duration: 2-3 days
- Dependencies: None

**Phase 2: Data Migration Tool**
- Duration: 3-5 days
- Dependencies: Phase 1 complete

**Phase 3: Parallel Operation**
- Duration: 2-3 days
- Dependencies: Phase 2 complete

**Phase 4: Full Migration & Validation**
- Duration: 3-5 days
- Dependencies: Phase 3 complete, testing period

**Phase 5: Switch to KV-Only Mode**
- Duration: 2-3 days
- Dependencies: Phase 4 validated

**Phase 6: Decommission File Storage**
- Duration: 1-2 days
- Dependencies: Phase 5 stable

**Total Estimated Duration: 13-21 days**

### Recommended Approach

**Option A: Big Bang Migration**
- Complete all phases in sequence
- Faster overall
- Higher risk
- Recommended if: Data volume is small, team is confident

**Option B: Incremental Migration (Recommended)**
- Migrate one project at a time
- Test each migration
- Lower risk
- Recommended if: Large data volume, need to minimize risk

**Option C: Parallel Operation Period**
- Run dual-write for extended period (2-4 weeks)
- Validate data consistency
- Gradual cutover
- Recommended if: Critical production system, need maximum safety

---

## Success Criteria

### Technical Success
- ✅ All data successfully migrated to local KV
- ✅ No data loss or corruption
- ✅ Application works identically with KV
- ✅ Performance is acceptable (within 20% of file-based)
- ✅ All tests pass

### Functional Success
- ✅ All UI features work correctly
- ✅ Analytics dashboard works
- ✅ Search/filtering works
- ✅ Bulk operations work
- ✅ No user-visible regressions

### Operational Success
- ✅ Local development setup is simple
- ✅ Documentation is complete
- ✅ Team can work effectively
- ✅ No significant productivity loss

---

## Dependencies & Prerequisites

### Technical Prerequisites
- Docker installed (for local Redis)
- Node.js 18+ (already have)
- Understanding of Redis/KV concepts
- Backup strategy in place

### Data Prerequisites
- Complete backup of `/pm` directory
- Validation of current data integrity
- Documentation of data structure

### Team Prerequisites
- Team understanding of migration plan
- Approval from stakeholders
- Time allocated for migration
- Testing resources available

---

## Open Questions & Decisions Needed

1. **Local KV Implementation**
   - [ ] Which option? (Docker recommended)
   - [ ] Use REST API or direct connection?
   - [ ] Include RedisInsight for debugging?

2. **Migration Approach**
   - [ ] Big bang or incremental?
   - [ ] How long for parallel operation?
   - [ ] Migration validation criteria?

3. **File System Archive**
   - [x] Rename `/pm` to `/pm-backup` (not delete) ✅
   - [ ] Keep file system code or remove?
   - [ ] How long to keep `/pm-backup`?

4. **Development Workflow**
   - [ ] How to handle local KV data in Git? (probably ignore)
   - [ ] How to share data between developers?
   - [ ] How to reset local KV?

5. **Production Considerations**
   - [x] Zero production changes required ✅
   - [x] No Vercel deployment updates needed ✅
   - [ ] Monitoring/alerting changes? (None expected)

---

## Next Steps

1. **Review & Approve Strategy**
   - Review this document
   - Answer open questions
   - Approve approach

2. **Create Detailed Implementation Plan**
   - Break down each phase into tasks
   - Assign owners
   - Set timeline

3. **Begin Phase 1**
   - Set up local Redis
   - Update repository layer
   - Test basic functionality

---

## Appendix

### A. Key Structure Reference

**Current KV Key Structure:**
```
pm:project:[project-name]                    # Project data
pm:epic:[project-name]:[epic-name]            # Epic data
pm:story:[project-name]:[epic-name]:[story-id] # Story data
pm:projects:list                               # Global projects list
pm:people:global                              # Global people data
pm:epic:[project-name]:[epic-name]:stories    # Epic story list
```

### B. Environment Variables Reference

**Current:**
```bash
# Production KV
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Environment Detection
ENVIRONMENT=DEV|PROD
VERCEL=1
NODE_ENV=development|production
```

**Proposed (Local Development only - .env.local):**
```bash
# Local KV - Point to local REST API proxy
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token-any-value

# Optional: Override to use KV in local dev
USE_LOCAL_KV=true  # Only if we want to force KV mode locally

# Dual Write (Phase 3) - Optional
DUAL_WRITE=true
```

**Production (Vercel - unchanged):**
```bash
# Set automatically by Vercel Marketplace
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Environment detection (unchanged)
VERCEL=1
ENVIRONMENT=PROD
```

### C. Migration Script Example Structure

```typescript
// High-level structure
async function migrateToLocalKV(options: MigrationOptions) {
  // 1. Validate environment
  await validateLocalKV()

  // 2. Create backup
  if (options.backup) {
    await createBackup()
  }

  // 3. Discover all data
  const projects = await discoverProjects()
  const epics = await discoverEpics(projects)
  const stories = await discoverStories(epics)
  const people = await discoverPeople()

  // 4. Migrate data
  if (!options.dryRun) {
    await migratePeople(people)
    await migrateProjects(projects)
    await migrateEpics(epics)
    await migrateStories(stories)
  }

  // 5. Validate
  if (options.validate) {
    await validateMigration(projects, epics, stories, people)
  }

  // 6. Generate report
  await generateReport()
}
```

---

**Document Status**: Strategy - Awaiting Approval
**Last Updated**: 2025-01-15
**Next Review**: After approval

