# Data Model (JSON-Based)

## Storage Strategy

**GitHub JSON = Source of Truth**

All data is stored as JSON files in the GitHub repo. Nuxt server routes read/write these files via the GitHub API.

```
data/
├── jobs/
│   └── YYYY-MM/
│       └── YYYY-MM-DD.json        # Daily scraped jobs
├── applications.json               # All application records
└── archived/
    └── YYYY-MM/                   # Jobs older than 90 days
        └── YYYY-MM-DD.json
```

---

## Job Schema

```typescript
interface Job {
  // Identity
  id: string;                    // Format: {source}-{hash}
  source: string;                // "RemoteOK", "WeWorkRemotely", etc.
  url: string;                   // Link to original posting
  
  // Content
  title: string;
  company: string;
  description: string;
  location: string;              // "Remote", "City, ST", etc
  is_remote: boolean;
  
  // Compensation
  salary_min?: number;           // USD annual
  salary_max?: number;
  salary_currency?: string;      // Default: "USD"
  
  // Classification
  role_type?: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'support' | 'other';
  experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'any';
  tags: string[];                // ["vue", "nuxt", "javascript"]
  
  // Dates
  date_posted: string;           // ISO date
  date_scraped: string;          // ISO date
  
  // User state (stored in job record)
  is_favorite: boolean;          // Default: false
  is_hidden: boolean;            // Default: false (rejected/hidden)
}
```

---

## Application Schema

```typescript
interface Application {
  id: string;                    // Format: app-{timestamp}
  job_id: string;                // Links to Job
  
  // Pipeline status
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  
  // Timeline
  date_applied: string;          // ISO datetime
  updated_at: string;            // ISO datetime
  
  // Content
  cover_letter?: string;         // Full cover letter text
  notes?: string;                // Interview notes, etc
  
  // Computed/cached (optional)
  company?: string;              // Denormalized from job
  position?: string;             // Denormalized from job
}
```

---

## Status Flow

### Job Lifecycle

```
Scraped → [is_hidden: false] → Visible in "Post" tab
                ↓
         [User favorites] → Starred
                ↓
         [User applies] → Application created
                ↓
         [User hides] → Hidden from default view
```

### Application Pipeline

```
applied → interview → offer
   ↓
rejected (at any stage)
```

---

## File Formats

### Daily Jobs File (`data/jobs/YYYY-MM/YYYY-MM-DD.json`)

```json
[
  {
    "id": "remoteok-abc123",
    "title": "Frontend Developer",
    "company": "RemoteCorp",
    "location": "Remote",
    "is_remote": true,
    "salary_min": 60000,
    "salary_max": 80000,
    "description": "We are looking for...",
    "url": "https://remoteok.com/job/abc123",
    "source": "RemoteOK",
    "date_posted": "2025-05-17",
    "date_scraped": "2025-05-17",
    "tags": ["vue", "javascript", "remote"],
    "role_type": "frontend",
    "is_favorite": false,
    "is_hidden": false
  }
]
```

### Applications File (`data/applications.json`)

```json
[
  {
    "id": "app-1715961600000",
    "job_id": "remoteok-abc123",
    "status": "applied",
    "date_applied": "2025-05-17T10:00:00Z",
    "updated_at": "2025-05-17T10:00:00Z",
    "cover_letter": "Dear Hiring Manager...",
    "notes": "Applied via LinkedIn"
  }
]
```

---

## Data Operations

### Read All Jobs

Server route fetches all daily JSON files, merges into single array:

```typescript
// server/utils/jobs.ts
export async function getAllJobs(): Promise<Job[]> {
  const months = await listGitHubDir('data/jobs')
  const jobs: Job[] = []
  
  for (const month of months) {
    const files = await listGitHubDir(`data/jobs/${month}`)
    for (const file of files) {
      const dailyJobs = await fetchGitHubJson<Job[]>(`data/jobs/${month}/${file}`)
      jobs.push(...dailyJobs)
    }
  }
  
  return jobs
}
```

### Update Job (Favorite/Hide)

```typescript
// Find job in daily file, update, commit back
export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const { month, file, job } = await findJobById(id)
  
  Object.assign(job, updates)
  
  await commitGitHubJson(
    `data/jobs/${month}/${file}`,
    await getDailyJobs(month, file), // Re-fetch to avoid conflicts
    `Update job ${id}: ${Object.keys(updates).join(', ')}`
  )
  
  return job
}
```

### Create Application

```typescript
export async function createApplication(app: Omit<Application, 'id'>): Promise<Application> {
  const newApp: Application = {
    ...app,
    id: `app-${Date.now()}`,
    updated_at: new Date().toISOString()
  }
  
  const apps = await getAllApplications()
  apps.push(newApp)
  
  await commitGitHubJson('data/applications.json', apps, `Add application for ${app.job_id}`)
  
  return newApp
}
```

---

## Archival Strategy

Jobs older than 90 days are moved to `data/archived/`:

```typescript
// server/utils/archive.ts
export async function archiveOldJobs() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  
  const jobs = await getAllJobs()
  const [active, old] = partition(jobs, j => new Date(j.date_scraped) > cutoff)
  
  // Move old jobs to archive directory by month
  for (const job of old) {
    const month = job.date_scraped.slice(0, 7) // YYYY-MM
    await moveToArchive(job, month)
  }
  
  // Update stats JSON (kept for dashboards)
  await updateArchivedStats(old)
}
```

---

## Schema Validation

JSON files are validated before commit:

```typescript
// server/utils/validate.ts
import { z } from 'zod'

const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  url: z.string().url(),
  source: z.string(),
  date_posted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_scraped: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_remote: z.boolean(),
  tags: z.array(z.string()),
  is_favorite: z.boolean().default(false),
  is_hidden: z.boolean().default(false)
})

export const validateJob = (data: unknown) => JobSchema.parse(data)
```

---

## Migration from SQLite

| SQLite | JSON Equivalent |
|--------|-----------------|
| `jobs` table | `data/jobs/**/*.json` files |
| `applications` table | `data/applications.json` |
| `UPDATE jobs SET ...` | Read → modify → commit JSON |
| `SELECT * FROM jobs` | Load all JSON, merge arrays |
| Indexes | In-memory Map after loading |
