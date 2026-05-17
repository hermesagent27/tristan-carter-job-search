# Job Search UI - Implementation Plan (Nuxt 4 Full-Stack)

**Project:** tristan-carter-job-search  
**Goal:** Single Nuxt 4 app on Vercel — frontend + API routes for job tracking  
**Date:** 2025-05-17 (Updated)  
**Status:** Phase 1 Planning  

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Single Deploy)                    │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │   Nuxt 4 UI     │◄──────►│   Nitro Server Routes       │ │
│  │   (app/)        │        │   /api/jobs.get.ts          │ │
│  │   Vue + Tailwind│        │   /api/jobs/[id].patch.ts   │ │
│  │   Pinia Stores  │        │   /api/apps.post.ts         │ │
│  └─────────────────┘        │   /api/stats.get.ts         │ │
│                               └─────────────────────────────┘ │
│                                          │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
                     ┌─────────────────────┘
                     │  (GitHub API fetch)
           ┌─────────▼──────────┐
           │   GitHub Repo        │
           │   data/jobs/*.json   │
           │   data/applications  │
           └──────────────────────┘
```

**Tech Stack:**
- **Framework:** Nuxt 4 (full-stack, SSR optional)
- **Styling:** Tailwind CSS + DaisyUI
- **State:** Pinia (auto-imported via `@pinia/nuxt`)
- **Charts:** `vue-chartjs` (Chart.js wrapper)
- **Host:** Vercel (single deploy)

**Key Decisions:**
- ✅ No FastAPI — use Nitro server routes instead
- ✅ No SQLite — GitHub JSON is source of truth
- ✅ No auth — single user (you)
- ✅ Auto-sync — daily cron commits new jobs to repo

---

## Data Flow

```
Daily Cron (GitHub Actions)
    ↓
Scraper runs → commits to `data/jobs/YYYY-MM/YYYY-MM-DD.json`
    ↓
Nuxt API routes fetch from GitHub (via API) or local JSON
    ↓
Frontend displays + mutates via same API routes
    ↓
Mutations (favorites, applications) committed back to GitHub
```

---

## Phase 1: Nuxt 4 Foundation + Server Routes

**Goal:** Working API that reads GitHub JSON, serves jobs to frontend

### 1.1 Directory Structure (Nuxt 4)

```
frontend/                               # Nuxt 4 project root
├── app/                                # Application directory
│   ├── components/
│   │   ├── jobs/
│   │   │   ├── JobCard.vue           # Company, desc, salary, actions
│   │   │   ├── JobFilters.vue        # Role, remote, salary filters
│   │   │   └── JobTabs.vue           # Post | Applied | Interview | Offer
│   │   └── ui/                        # Shared UI (Button, Card, Badge)
│   ├── composables/
│   │   ├── useJobs.ts                # Fetch + cache jobs
│   │   ├── useApplications.ts        # CRUD applications
│   │   └── useFilters.ts             # Filter logic
│   ├── layouts/
│   │   └── default.vue               # App shell with nav
│   ├── pages/                         # File-based routing
│   │   ├── index.vue                  # Jobs list (tabbed by status)
│   │   ├── dashboard.vue              # Stats page
│   │   └── applications/
│   │       └── [id].vue               # Cover letter + answers
│   ├── stores/                        # Pinia stores
│   │   ├── jobs.ts                    # Jobs state + filters
│   │   └── applications.ts            # Applications state
│   ├── app.vue                        # Root component
│   ├── app.config.ts                  # App config
│   ├── nuxt.config.ts                 # Nuxt 4 config
│   └── tailwind.config.ts             # Tailwind + DaisyUI
├── server/                             # Nitro API routes
│   ├── api/
│   │   ├── jobs.get.ts               # GET /api/jobs (filterable)
│   │   ├── jobs/
│   │   │   └── [id].patch.ts         # PATCH /api/jobs/:id (favorite, hide)
│   │   ├── applications.get.ts       # GET /api/applications
│   │   ├── applications.post.ts      # POST /api/applications
│   │   ├── applications/
│   │   │   └── [id].patch.ts         # PATCH /api/applications/:id
│   │   └── stats.get.ts              # GET /api/stats
│   ├── utils/
│   │   ├── github.ts                 # GitHub API client
│   │   └── jobs.ts                   # Job data utilities
│   └── middleware/                    # Rate limiting, CORS
├── public/
├── package.json
└── .env                               # GITHUB_TOKEN, etc
```

### 1.2 Server Route: /api/jobs.get.ts

**Purpose:** Fetch jobs from GitHub JSON, support filtering

```typescript
// server/api/jobs.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Fetch latest job data from GitHub
  const jobs = await fetchFromGitHub('data/jobs')
  
  // Apply filters
  const filtered = jobs.filter(job => {
    if (query.status && getJobStatus(job) !== query.status) return false
    if (query.role && job.role_type !== query.role) return false
    if (query.remote === 'true' && !job.is_remote) return false
    if (query.favorites === 'true' && !job.is_favorite) return false
    if (query.hidden === 'false' && job.is_hidden) return true
    return true
  })
  
  // Sort
  if (query.sort === 'date') {
    filtered.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted))
  } else if (query.sort === 'salary') {
    filtered.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0))
  }
  
  return { jobs: filtered, total: filtered.length }
})
```

### 1.3 Server Route: /api/jobs/[id].patch.ts

**Purpose:** Update job (favorite, hide)

```typescript
// server/api/jobs/[id].patch.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  // Read current state from GitHub
  const jobs = await fetchFromGitHub('data/jobs')
  const job = jobs.find(j => j.id === id)
  
  if (!job) throw createError({ statusCode: 404 })
  
  // Update
  if (body.is_favorite !== undefined) job.is_favorite = body.is_favorite
  if (body.is_hidden !== undefined) job.is_hidden = body.is_hidden
  
  // Commit back to GitHub
  await commitToGitHub(`data/jobs/${getCurrentMonth()}/${getCurrentDate()}.json`, jobs)
  
  return { success: true, job }
})
```

### 1.4 Server Route: /api/applications.post.ts

**Purpose:** Create new application (status change)

```typescript
// server/api/applications.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const application = {
    id: `app-${Date.now()}`,
    job_id: body.job_id,
    status: body.status || 'applied',
    date_applied: new Date().toISOString(),
    cover_letter: body.cover_letter || '',
    notes: body.notes || '',
    updated_at: new Date().toISOString()
  }
  
  // Append to applications.json
  const apps = await fetchFromGitHub('data/applications.json') || []
  apps.push(application)
  
  await commitToGitHub('data/applications.json', apps)
  
  return { success: true, application }
})
```

### 1.5 Server Route: /api/stats.get.ts

**Purpose:** Dashboard statistics

```typescript
// server/api/stats.get.ts
export default defineEventHandler(async (event) => {
  const [jobs, applications] = await Promise.all([
    fetchFromGitHub('data/jobs'),
    fetchFromGitHub('data/applications.json') || []
  ])
  
  return {
    total_jobs: jobs.length,
    jobs_by_role: countBy(jobs, 'role_type'),
    jobs_by_status: {
      post: jobs.filter(j => !getApplication(j.id)).length,
      applied: applications.filter(a => a.status === 'applied').length,
      interview: applications.filter(a => a.status === 'interview').length,
      offer: applications.filter(a => a.status === 'offer').length
    },
    salaries: {
      avg: average(jobs.filter(j => j.salary_max).map(j => j.salary_max)),
      range: [min(jobs, 'salary_min'), max(jobs, 'salary_max')]
    }
  }
})
```

### 1.6 Tests Required

- [ ] `GET /api/jobs` returns array
- [ ] Filters work (role, remote, favorites)
- [ ] `PATCH /api/jobs/:id` updates favorite
- [ ] `POST /api/applications` creates app
- [ ] `GET /api/stats` returns numbers
- [ ] Changes persist to GitHub

---

## Phase 2: Frontend - Jobs Page

**Goal:** Browse jobs with filtering, marking favorites/hidden

### 2.1 State Management (Pinia)

```typescript
// stores/jobs.ts
export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<Job[]>([])
  const filters = reactive({
    roleTypes: [] as string[],
    isRemote: null as boolean | null,
    favoritesOnly: false,
    hidden: false
  })
  const sortBy = ref<'date' | 'salary' | 'relevance'>('date')
  
  const filteredJobs = computed(() => {
    return jobs.value.filter(job => {
      if (filters.roleTypes.length && !filters.roleTypes.includes(job.role_type)) return false
      if (filters.isRemote !== null && job.is_remote !== filters.isRemote) return false
      return true
    })
  })
  
  async function fetchJobs() {
    const { data } = await $fetch('/api/jobs', { query: filters })
    jobs.value = data.jobs
  }
  
  return { jobs, filters, filteredJobs, fetchJobs }
})
```

### 2.2 JobCard Component

**Props:**
- `job: Job` — title, company, salary, description, isRemote, isFavorite, isHidden
- `application?: Application` — status, notes

**Actions:**
- ☆/★ Favorite toggle → `PATCH /api/jobs/:id`
- ✕ Hide → `PATCH /api/jobs/:id` (is_hidden: true)
- Click → navigate to `/applications/:id`
- External link → job posting URL

```vue
<!-- components/jobs/JobCard.vue -->
<template>
  <div 
    class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
    :class="{ 'opacity-50': job.is_hidden }"
  >
    <div class="card-body">
      <div class="flex justify-between items-start">
        <h3 class="card-title">{{ job.title }}</h3>
        <button @click="toggleFavorite" class="btn btn-ghost btn-sm">
          {{ job.is_favorite ? '★' : '☆' }}
        </button>
      </div>
      
      <p class="text-muted">{{ job.company }} • {{ job.location }}</p>
      
      <p class="line-clamp-2">{{ job.description }}</p>
      
      <div class="card-actions justify-between items-center mt-4">
        <span class="badge badge-primary">${{ job.salary_min }} - ${{ job.salary_max }}</span>
        <div class="flex gap-2">
          <NuxtLink :to="`/applications/${job.id}`" class="btn btn-primary btn-sm">
            {{ application ? 'View' : 'Start Application' }}
          </NuxtLink>
          <a :href="job.url" target="_blank" class="btn btn-ghost btn-sm">↗</a>
          <button @click="hideJob" class="btn btn-ghost btn-sm text-error">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 2.3 Jobs Page with Tabs

```vue
<!-- pages/index.vue -->
<template>
  <div class="container mx-auto p-4">
    <JobFilters v-model="filters" />
    
    <tabs v-model="activeTab" class="mt-4">
      <tab name="post">Post ({{ counts.post }})</tab>
      <tab name="applied">Applied ({{ counts.applied }})</tab>
      <tab name="interview">Interview ({{ counts.interview }})</tab>
      <tab name="offer">Offers ({{ counts.offer }})</tab>
    </tabs>
    
    <div class="grid gap-4 mt-4">
      <JobCard
        v-for="job in filteredJobs"
        :key="job.id"
        :job="job"
        :application="getApplication(job.id)"
      />
    </div>
  </div>
</template>
```

### 2.4 Tests Required

- [ ] JobCard renders company, salary, actions
- [ ] Filter chips update results
- [ ] Favorite toggle persists on refresh
- [ ] Tab switching filters by status

---

## Phase 3: Dashboard Page

**Goal:** Statistics visualization with customizable graphs

### 3.1 Route

```
pages/dashboard.vue          # Static route
```

### 3.2 Stats to Display

**Cards:**
- Total jobs scraped (today/week/month)
- Jobs by role type
- Applications by status
- Average salary
- Response rate

**Time-Series Graph:**
- X: Date (day/week/month)
- Y: Count (selectable: jobs, applications, interviews, offers)
- Controls: 7d/30d/90d/YTD

### 3.3 Components

```
components/dashboard/
├── StatCard.vue              # Big number with icon
├── RoleDistribution.vue      # Pie/donut chart
├── StatusFunnel.vue          # Bar chart (post → applied → interview → offer)
└── TimeSeriesChart.vue       # Line chart with metric selector
```

### 3.4 Tests Required

- [ ] Stats load from `/api/stats`
- [ ] Charts render with data
- [ ] Time range selector updates chart

---

## Phase 4: Application Page (Dynamic)

**Goal:** Cover letter + application answers for each job

### 4.1 Route

```
pages/applications/[id].vue    # Dynamic route
```

### 4.2 Sections

1. **Job Info Card** — snapshot of title, company, salary
2. **Status Timeline** — Post → Applied → Interview → Offer
   - Click to change status
   - Timestamps for each transition
3. **Cover Letter** — textarea with auto-template
4. **Application Answers** — key-value for common questions
5. **Notes** — free-form textarea

### 4.3 Cover Letter Template

```typescript
// composables/useCoverLetter.ts
export function useCoverLetter(job: Job) {
  const template = ref(`
Dear Hiring Manager,

I'm excited to apply for the ${job.title} position at ${job.company}. 
With my experience in Vue.js, Nuxt, and Tailwind CSS, I'm confident I can contribute...

Why this role:
- ${job.tags.filter(t => ['vue', 'nuxt', 'javascript'].includes(t)).join(', ')} experience
- Frontend-focused with design sensibilities
- Passion for clean, maintainable code

Thank you for considering my application.

Best,
Tristan Carter
  `.trim())
  
  return { template }
}
```

### 4.4 Tests Required

- [ ] Page loads job details
- [ ] Status change triggers `PATCH /api/applications/:id`
- [ ] Cover letter auto-populates template
- [ ] Notes save correctly

---

## Phase 5: Deployment

### 5.1 Vercel Configuration

```bash
# Build settings
Framework: Nuxt.js
Build command: cd frontend && npm run build
Output directory: frontend/.output/public
```

**Environment Variables:**
```
GITHUB_TOKEN=ghp_xxx        # For reading/writing repo
GITHUB_REPO=hermesagent27/tristan-carter-job-search
NUXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 5.2 Nuxt 4 Configuration

```typescript
// frontend/nuxt.config.ts
export default defineNuxtConfig({
  // Nuxt 4: app directory is default
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  
  runtimeConfig: {
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL
    }
  },
  
  nitro: {
    preset: 'vercel'
  }
})
```

### 5.3 Data Sync Architecture

**No redeployment needed** — server routes fetch fresh data from GitHub on every request (or cache briefly).

**Cron job** (already exists):
1. Runs daily
2. Scrapes jobs
3. Commits new JSON to `data/jobs/`
4. Posts summary to Slack

**Nuxt reads:**
- Server routes query GitHub API for JSON files
- Or clone/read local if repo is embedded at build

### 5.4 Caching Strategy

```typescript
// server/utils/github.ts
const CACHE = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function fetchFromGitHub(path: string) {
  // Check cache
  if (CACHE.has(path)) {
    const { data, timestamp } = CACHE.get(path)
    if (Date.now() - timestamp < CACHE_TTL) return data
  }
  
  // Fetch from GitHub
  const data = await $fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
  
  // Cache it
  CACHE.set(path, { data, timestamp: Date.now() })
  
  return data
}
```

---

## Development Order (Incremental)

### Sprint 1: Nuxt 4 Setup + Server Routes ✅ Test First
1. [ ] Initialize Nuxt 4 project in `frontend/`
2. [ ] Configure Tailwind + DaisyUI + Pinia
3. [ ] Create `server/api/jobs.get.ts` — fetch from GitHub
4. [ ] Create `server/utils/github.ts` — GitHub API client
5. [ ] Test: Server route returns jobs

### Sprint 2: Jobs Page ✅ Test First
1. [ ] Create `pages/index.vue` with tabs
2. [ ] Build `JobCard` component
3. [ ] Add filtering UI
4. [ ] Connect to API
5. [ ] Test: Browse, filter, favorite, hide

### Sprint 3: Dashboard ✅ Test First
1. [ ] Create `server/api/stats.get.ts`
2. [ ] Add `vue-chartjs` + Chart.js
3. [ ] Build dashboard components
4. [ ] Create `pages/dashboard.vue`
5. [ ] Test: Stats display correctly

### Sprint 4: Application Page ✅ Test First
1. [ ] Create `server/api/applications.*.ts` routes
2. [ ] Build `pages/applications/[id].vue`
3. [ ] Add cover letter template
4. [ ] Add status timeline
5. [ ] Test: Full application workflow

### Sprint 5: Polish + Deploy ✅ Test First
1. [ ] Add loading states
2. [ ] Add error handling
3. [ ] Deploy to Vercel
4. [ ] Wire up cron notifications
5. [ ] End-to-end test

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Backend hosting? | Nuxt server routes on Vercel (no FastAPI) |
| Database? | GitHub JSON via GitHub API |
| Auth? | None — single user |
| Real-time updates? | Auto on page load (fetch fresh from GitHub) |
| Charts? | vue-chartjs (Chart.js) |
| Redeploy on new data? | No — server routes fetch live |

---

## Next Step

**Start Sprint 1?**
I can scaffold the Nuxt 4 project with app directory structure, set up server routes, and test the GitHub JSON fetch.

Ready to begin?
