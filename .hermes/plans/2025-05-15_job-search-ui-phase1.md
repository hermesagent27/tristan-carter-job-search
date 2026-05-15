# Job Search UI - Implementation Plan

**Project:** tristan-carter-job-search  
**Goal:** FastAPI + Nuxt UI for browsing/filtering jobs, tracking applications  
**Date:** 2025-05-15  
**Status:** Phase 1 Planning  

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nuxt UI       │────▶│   FastAPI       │────▶│   SQLite DB     │
│   (Vercel)      │     │   (Self-hosted) │     │   (Server)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│   GitHub Repo   │──────────────┘
                        │   (job data)    │
                        └─────────────────┘
```

**Tech Stack:**
- **Frontend:** Nuxt 4 + Vue + Tailwind + DaisyUI
- **Backend:** FastAPI + SQLAlchemy + Pydantic
- **Database:** SQLite (replicated from GitHub JSON)
- **Hosting:** Vercel (frontend), self-hosted (backend)

---

## Phase 1: FastAPI Backend + Data Sync

**Goal:** Working backend that serves job data via REST API

### 1.1 Database Schema

```sql
-- jobs table (from scraped data)
CREATE TABLE jobs (
    id TEXT PRIMARY KEY,              -- hash of URL
    title TEXT NOT NULL,
    company TEXT,
    link TEXT NOT NULL,
    description TEXT,
    role_type TEXT,                  -- frontend | backend | fullstack | support | etc
    tech_stack JSON,                 -- {"vue": 0.9, "nuxt": 0.8, "react": 0.3}
    is_remote BOOLEAN,
    location TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    source TEXT,                     -- RemoteOK | WeWorkRemotely | etc
    date_posted DATE,
    scraped_at TIMESTAMP,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- applications table (user tracking)
CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES jobs(id),
    status TEXT CHECK (status IN ('post', 'applied', 'interview', 'offer', 'rejected')),
    applied_at TIMESTAMP,
    cover_letter TEXT,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List jobs with filters (role_type, is_remote, favorites, hidden) |
| GET | `/jobs/{id}` | Get single job details |
| POST | `/jobs/{id}/favorite` | Toggle favorite status |
| POST | `/jobs/{id}/hide` | Hide/reject a job |
| GET | `/applications` | List applications by status |
| POST | `/applications` | Create new application |
| PATCH | `/applications/{id}` | Update status, notes, cover letter |
| GET | `/applications/{id}` | Get application with job details |
| GET | `/stats` | Dashboard statistics |
| POST | `/sync` | Triggers sync from GitHub JSON |

### 1.3 Directory Structure (Backend)

```
api/
├── main.py                 # FastAPI app entry
├── database.py             # SQLAlchemy setup
├── models.py               # SQLAlchemy models
├── schemas.py              # Pydantic schemas
├── routers/
│   ├── jobs.py             # Job endpoints
│   ├── applications.py     # Application endpoints
│   └── stats.py            # Dashboard stats
├── services/
│   ├── sync.py             # GitHub JSON → SQLite sync
│   └── search.py           # Search/filter logic
└── requirements.txt
```

### 1.4 Tests Required

- [ ] API endpoints return correct schema
- [ ] Filters work (role_type, is_remote, favorites)
- [ ] Sync correctly imports GitHub JSON
- [ ] Application status transitions work

---

## Phase 2: Nuxt 4 Frontend - Jobs Page

**Goal:** Browse jobs with filtering, marking favorites/hidden

### 2.1 Nuxt 4 Directory Structure

```
frontend/                               # Nuxt 4 project root
├── app/                                # Application directory (Nuxt 4 convention)
│   ├── components/
│   │   ├── jobs/
│   │   │   ├── JobCard.vue           # Display company, desc, salary
│   │   │   ├── JobFilters.vue        # Role, remote, tech filters
│   │   │   └── JobTabs.vue           # post | applied | interview | offer
│   │   ├── ui/                        # Shared UI components
│   │   └── dashboard/
│   │       ├── StatCard.vue
│   │       ├── TimeSeriesChart.vue
│   │       └── RoleDistribution.vue
│   ├── layouts/
│   │   └── default.vue               # App shell with nav
│   ├── middleware/                    # Auth, redirects (future)
│   ├── pages/                         # File-based routing
│   │   ├── index.vue                  # Jobs page (tabbed)
│   │   ├── dashboard.vue              # Stats page
│   │   └── applications/
│   │       └── [id].vue               # Dynamic: cover letter + answers
│   ├── stores/                        # Pinia stores (auto-imported)
│   │   ├── jobs.ts                    # Jobs state + filters
│   │   ├── applications.ts            # Applications state
│   │   └── dashboard.ts               # Stats state
│   ├── composables/                     # Auto-imported composables
│   │   ├── useApi.ts                  # API client
│   │   ├── useFilters.ts              # Filter logic
│   │   └── useApplications.ts         # Application CRUD
│   ├── utils/                          # Helper functions
│   ├── app.config.ts                   # App config
│   ├── app.vue                         # Root component
│   ├── nuxt.config.ts                  # Nuxt 4 config
│   └── tailwind.config.ts              # Tailwind setup
├── public/                             # Static assets
├── server/                             # Nitro server (future: SSR)
├── package.json
├── tsconfig.json
└── .env                                # API_URL, etc
```

**Nuxt 4 Key Notes:**
- `app/` directory is the new default (can use `src/` if preferred)
- `pages/` file-based routing (no config needed)
- `composables/` auto-imported across app
- `stores/` for Pinia (requires `@pinia/nuxt` module)
- `server/` for Nitro endpoints (optional, use FastAPI instead)

### 2.2 JobCard Component

**Props:**
- `job: Job` — title, company, salary, description, isRemote
- `application: Application | null` — status, notes

**Actions:**
- Favorite ☆ / ★ toggle
- Hide × (reject)
- Click → open application page
- External link icon → job posting

### 2.3 State Management (Pinia)

```typescript
// stores/jobs.ts
interface JobsState {
  jobs: Job[]
  filters: {
    roleTypes: string[]
    isRemote: boolean | null
    techStack: string[]
    favoritesOnly: boolean
    hidden: boolean  // default false
  }
  sortBy: 'date' | 'salary' | 'relevance'
}

// stores/applications.ts  
interface ApplicationsState {
  applications: Application[]
  activeTab: 'post' | 'applied' | 'interview' | 'offer'
}
```

### 2.4 Page Structure

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <JobFilters />
    <JobTabs v-model="activeTab" />
    <div class="grid gap-4">
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

### 2.5 Tests Required

- [ ] JobCard renders correctly
- [ ] Filters update displayed jobs
- [ ] Favorites persist (API call)
- [ ] Tab switching shows correct jobs

---

## Phase 3: Dashboard Page

**Goal:** Statistics visualization with customizable graph

### 3.1 Page Route

```
pages/dashboard.vue          # Static route
```

### 3.2 Stats to Display

**Cards:**
- Total jobs scraped (today/this week/this month)
- Jobs by role type (pie chart)
- Applications by status (bar chart)
- Salary ranges (histogram)
- Conversion rate: applied → interview → offer

### 3.3 Time-Series Graph

**X-axis:** Date (day/week/month view)  
**Y-axis:** Jobs count (selectable metric)

**Metrics:**
- Jobs scraped
- Applications sent
- Interviews scheduled
- Offers received

**Controls:**
- Time range: 7d / 30d / 90d / YTD / All
- Granularity: daily / weekly / monthly

### 3.4 Components

```
components/dashboard/
├── StatCard.vue              # Big number cards
├── RoleDistribution.vue      # Pie chart
├── StatusFunnel.vue          # Bar/conversion
├── SalaryChart.vue           # Histogram
└── TimeSeriesChart.vue       # Customizable graph
```

---

## Phase 4: Application Page (Dynamic)

**Goal:** Cover letter + application answers for each job

### 4.1 Route

```
pages/applications/[id].vue    # Dynamic route
```

### 4.2 Sections

1. **Job Info Card** — snapshot of job details
2. **Status Timeline** — visual: Post → Applied → Interview → Offer
   - Click to change status
   - Timestamp each transition
3. **Cover Letter** — textarea with template
4. **Application Answers** — key-value pairs for common questions
5. **Notes** — free-form text area

### 4.3 Auto-Generated Content

**Cover Letter Template:**
- Pull from `data/templates/cover-letter.md`
- Auto-fill: {company}, {position}, {your experience}
- Editable per application

**Application Answers (suggested):**
- "Why this company?" — pull from company research
- "Why this role?" — match job requirements to your skills
- "Salary expectations" — show from job data

---

## Phase 5: Deployment

### 5.1 Vercel (Nuxt 4 Frontend)

```bash
# Build settings
Framework: Nuxt.js
Build command: npm run build
Output directory: .output/public
```

**Environment Variables:**
- `NUXT_PUBLIC_API_URL=https://api.yourdomain.com`

### 5.2 Nuxt 4 Configuration

```typescript
// frontend/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
    }
  },
  // SSR configuration (optional for Vercel)
  ssr: true,
  nitro: {
    preset: 'vercel',
  }
})
```

### 5.3 Self-Hosted Backend

Options:
1. **Fly.io** (free tier, easy SQLite persistence)
2. **Railway** (free tier, managed)
3. **Your VPS** (if you have one)

**Dockerfile** for FastAPI:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY api/requirements.txt .
RUN pip install -r requirements.txt
COPY api/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 5.4 GitHub Actions Sync

**New workflow:** `.github/workflows/sync-to-api.yml`
- Triggers on new commits to `data/jobs/`
- POSTs to FastAPI `/sync` endpoint

---

## Development Order (Incremental)

### Sprint 1: Backend Foundation ✅ Test before continue
1. [ ] Set up FastAPI project structure
2. [ ] Define database schema
3. [ ] Create `/jobs` endpoint with filtering
4. [ ] Create sync service (GitHub JSON → SQLite)
5. [ ] Manual test: API returns jobs correctly

### Sprint 2: Nuxt 4 Jobs Page ✅ Test before continue  
1. [ ] Set up Nuxt 4 project (`npx nuxi@latest init frontend`)
2. [ ] Configure `app/` directory structure
3. [ ] Install Tailwind + DaisyUI + Pinia
4. [ ] Create JobCard component
5. [ ] Create Jobs page with tabs
6. [ ] Wire up to backend API
7. [ ] Test: Browse, filter, favorite, hide

### Sprint 3: Dashboard ✅ Test before continue
1. [ ] Create stats endpoints
2. [ ] Build StatCard components
3. [ ] Add time-series chart
4. [ ] Test: Dashboard shows correct stats

### Sprint 4: Application Page ✅ Test before continue
1. [ ] Create application endpoints
2. [ ] Build status timeline UI
3. [ ] Add cover letter editor
4. [ ] Test: Full application workflow

### Sprint 5: Deployment ✅ Test before continue
1. [ ] Deploy backend
2. [ ] Deploy frontend to Vercel
3. [ ] Set up GitHub Actions sync
4. [ ] End-to-end test

---

## Open Questions

1. **Backend hosting:** Fly.io, Railway, or VPS?
2. **Database backups:** How often sync GitHub → API? Daily or on commit?
3. **Auth:** Do you need login/auth, or single-user acceptable for MVP?
4. **Real-time updates:** WebSocket for new jobs, or polling acceptable?

---

## Next Step

**Start Sprint 1?** 
I can begin scaffolding the FastAPI backend with the database schema and `/jobs` endpoint.
