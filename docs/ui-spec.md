# UI Specification - Nuxt 4 Full-Stack

## Design Philosophy

- **Clean:** Lots of whitespace, clear hierarchy
- **Fast:** Instant navigation, server-rendered where possible
- **Focused:** No fluff, just job search power tools
- **Personal:** Tailored to Vue/Nuxt stack

## Color Palette (DaisyUI)

```
Primary:    indigo-500       // Main actions
Secondary:  emerald-500      // Success, matches
Accent:     amber-500        // Warnings, highlights
Error:      red-500          // Rejections, deletions

Base:       slate-50         // Background
Base-100:   white            // Cards
Base-content: slate-800      // Text

// Vue/Nuxt branding
Vue Green:  #42b883
Nuxt Green: #00dc82
```

## Typography

- **Font Family:** System UI + Tailwind defaults
- **Headings:** font-bold, tracking-tight
- **Body:** font-normal, leading-relaxed

---

## Page Designs

### Home `/` — Jobs List with Tabs

```
+--------------------------------------------------+
|  🎯 Job Tracker            [Dashboard] [Stats]   |
+--------------------------------------------------+
|                                                  |
|  [🔍 Search jobs...]  [All Roles ▼] [Remote ☑️] |
|                                                  |
|  ┌─────────┬─────────┬─────────┬───────────┐  |
|  │ Post(44)│Applied(8)│Interview│Offers(1)  │  |
|  │         │         │   (3)   │           │  |
|  └─────────┴─────────┴─────────┴───────────┘  |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  ⭐ RemoteCorp                [★] [✕] [↗] |   |
|  |  Frontend Developer (Vue.js)               |   |
|  |  Remote • $65k-80k                          |   |
|  |                                           |   |
|  |  We're looking for a frontend developer... |   |
|  |                                           |   |
|  |  [Start Application]             [Vue][Nuxt]|   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  ⭐ TechGiant                  [☆] [✕] |   |
|  |  Full Stack Developer (React + Node)     |   |
|  |  Hybrid • $90k-110k                         |   |
|  |                                           |   |
|  |  [View Application]         [React][Node]  |   |
|  └──────────────────────────────────────────┘   |
|                                                  |
+--------------------------------------------------+
```

**Components:**
- `<JobSearchBar v-model="search" />` — Search input
- `<RoleFilter v-model="selectedRoles" />` — Multi-select chips
- `<JobTabs v-model="activeTab" :counts="counts" />` — Status tabs
- `<JobCard :job :application />` — Main job display

**JobCard Actions:**
- ☆/★ Favorite (top-right)
- ✕ Hide/Reject
- ↗ External link to posting
- "Start Application" / "View Application" button

---

### Dashboard `/dashboard` — Statistics

```
+--------------------------------------------------+
|  🎯 Job Tracker            [Jobs] [Dashboard]    |
+--------------------------------------------------+
|                                                  |
|  [Week] [Month] [Year] [Custom]                  |
|                                                  |
|  ┌───────────┐ ┌───────────┐ ┌───────────┐      |
|  | Jobs      | | Applied   | | Response  |      |
|  |   156     | |     12    | |    15%    |      |
|  | +23 this  | | +5 this   | | +3%       |      |
|  | week      | | week      | |           |      |
|  └───────────┘ └───────────┘ └───────────┘      |
|                                                  |
|  ┌─────────────────────────────────────────┐     |
|  |  📈 Activity Over Time                 |     |
|  |                                         |     |
|  |   Jobs ┃━━━━━━━━━━━━━━━━              |     |
|  |        ┃━━━━━━━━━━━━                  |     |
|  |        ┃━━━━━━━━━━━━━━━━━━            |     |
|  |   ─────────────────────────────────    |     |
|  |   Jan    Feb    Mar    Apr    May      |     |
|  |                                         |     |
|  |  Metric: [Jobs Applied ▼]               |     |
|  └─────────────────────────────────────────┘     |
|                                                  |
|  ┌─────────────┐  ┌─────────────────────────┐    |
|  | By Role     |  | By Source               |    |
|  |             |  |                         |    |
|  | ████ Frontend    |  ████████ RemoteOK        |    |
|  | ██ Fullstack     |  ████ WeWorkRemotely      |    |
|  | █ Backend        |  ███ Other               |    |
|  |             |  |                         |    |
|  └─────────────┘  └─────────────────────────┘    |
|                                                  |
+--------------------------------------------------+
```

**Components:**
- `<TimeRangeSelector v-model="range" />` — Week/Month/Year
- `<StatCard :title :value :change />` — Big number cards
- `<TimeSeriesChart :data :metric />` — Main line chart
- `<RoleDistribution :data />` — Pie/donut chart
- `<SourceBreakdown :data />` — Horizontal bar chart

---

### Application Page `/applications/[id]` — Cover Letter & Status

```
+--------------------------------------------------+
|  🎯 Job Tracker                                  |
+--------------------------------------------------+
|                                                  |
|  [← Back to Jobs]                                |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  🏢 RemoteCorp                    [Done] |   |
|  |  Frontend Developer (Vue.js)             |   |
|  |  Remote • Full-time • $65k-80k             |   |
|  |                                           |   |
|  |  Match: [████████░░░] 85%                 |   |
|  |  Tags: Vue, Nuxt, JavaScript, Tailwind    |   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  Status Timeline:                               |
|                                                  |
|  [Post]────[Applied ●]────[Interview]────[Offer]|   |
|               ↑                                  |
|           Click to change                       |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  📝 Cover Letter                         |   |
|  |                                           |   |
|  |  [Textarea with auto-generated content]  |   |
|  |                                           |   |
|  |  [Save Draft] [Copy to Clipboard]        |   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  💬 Application Answers                  |   |
|  |                                           |   |
|  |  Why this company?                       |   |
|  |  [Short answer input...]                 |   |
|  |                                           |   |
|  |  Why this role?                          |   |
|  |  [Short answer input...]                 |   |
|  |                                           |   |
|  |  Salary expectations?                    |   |
|  |  $[____]k-$[____]k                       |   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  ┌──────────────────────────────────────────┐   |
|  |  📓 Notes                                |   |
|  |  [Free-form notes textarea...]           |   |
|  └──────────────────────────────────────────┘   |
|                                                  |
+--------------------------------------------------+
```

**Components:**
- `<JobHeader :job />` — Company, title, salary
- `<StatusTimeline v-model="status" />` — Visual pipeline
- `<CoverLetterEditor v-model="coverLetter" :job />` — Auto-generated + editable
- `<ApplicationAnswers :job />` — Structured Q&A
- `<NotesEditor v-model="notes" />` — Free-form notes

---

## Component Inventory

### UI Primitives (DaisyUI)
- `<Button variant="primary|secondary|ghost|error" size="sm|md|lg">`
- `<Input v-model placeholder icon>`
- `<Select v-model :options>`
- `<Checkbox v-model label>`
- `<Card class="bg-base-100 shadow">`
- `<Badge variant="primary|secondary|accent">`

### Domain Components

| Component | Props | Description |
|-----------|-------|-------------|
| `JobCard` | `job`, `application?` | Main job display with actions |
| `JobTabs` | `modelValue`, `counts` | Status filter tabs |
| `JobFilters` | `v-model` | Role, remote, salary filters |
| `JobSearch` | `v-model` | Search input |
| `StatusBadge` | `status` | Color-coded status |
| `SalaryRange` | `min`, `max` | Formatted salary display |
| `MatchScore` | `score` | Visual match indicator |
| `TagList` | `tags` | Chip list |
| `StatCard` | `title`, `value`, `change` | Dashboard stat |
| `TimeSeriesChart` | `data`, `metric` | Line chart |
| `StatusTimeline` | `modelValue` | Pipeline visualization |
| `CoverLetterEditor` | `v-model`, `job` | Textarea with template |

### Layout Components
- `<AppLayout>` — Sidebar + main content
- `<AppNav>` — Navigation links
- `<PageHeader :title>` — Page title + actions

---

## State Management (Pinia)

### `useJobsStore`

```typescript
export const useJobsStore = defineStore('jobs', () => {
  // State
  const jobs = ref<Job[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Filters
  const filters = reactive({
    status: 'post' as JobStatus,
    roles: [] as string[],
    remote: null as boolean | null,
    favoritesOnly: false,
    search: ''
  })
  
  // Computed
  const filteredJobs = computed(() => {
    return jobs.value.filter(job => {
      // Apply status filter
      const jobStatus = getJobStatus(job, applications.value)
      if (filters.status && jobStatus !== filters.status) return false
      
      // Apply role filter
      if (filters.roles.length && !filters.roles.includes(job.role_type)) return false
      
      // Apply remote filter
      if (filters.remote !== null && job.is_remote !== filters.remote) return false
      
      // Apply favorites
      if (filters.favoritesOnly && !job.is_favorite) return false
      
      // Apply search
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const text = `${job.title} ${job.company} ${job.description}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      
      // Exclude hidden
      if (job.is_hidden) return false
      
      return true
    })
  })
  
  const counts = computed(() => ({
    post: jobs.value.filter(j => !applicationsByJobId.value[j.id]).length,
    applied: applications.value.filter(a => a.status === 'applied').length,
    interview: applications.value.filter(a => a.status === 'interview').length,
    offer: applications.value.filter(a => a.status === 'offer').length
  }))
  
  // Actions
  async function fetchJobs() {
    loading.value = true
    const { data } = await $fetch('/api/jobs')
    jobs.value = data.jobs
    loading.value = false
  }
  
  async function toggleFavorite(jobId: string) {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.is_favorite = !job.is_favorite
      await $fetch(`/api/jobs/${jobId}`, { method: 'PATCH', body: { is_favorite: job.is_favorite } })
    }
  }
  
  return { jobs, filters, filteredJobs, counts, fetchJobs, toggleFavorite }
})
```

### `useApplicationsStore`

```typescript
export const useApplicationsStore = defineStore('applications', () => {
  const applications = ref<Application[]>([])
  
  const getByJobId = computed(() => {
    return Object.fromEntries(applications.value.map(a => [a.job_id, a]))
  })
  
  async function fetchApplications() {
    const { data } = await $fetch('/api/applications')
    applications.value = data.applications
  }
  
  async function createApplication(jobId: string, data: Partial<Application>) {
    const app = await $fetch('/api/applications', {
      method: 'POST',
      body: { job_id: jobId, ...data }
    })
    applications.value.push(app)
    return app
  }
  
  async function updateStatus(id: string, status: ApplicationStatus) {
    await $fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      body: { status }
    })
    const app = applications.value.find(a => a.id === id)
    if (app) app.status = status
  }
  
  return { applications, getByJobId, fetchApplications, createApplication, updateStatus }
})
```

---

## Responsive Breakpoints

```
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

**Mobile adaptations:**
- Sidebar → Top nav bar
- Grid → Single column
- JobCard → Full width, stacked actions
- Dashboard → Stacked stat cards
- Timeline → Vertical instead of horizontal

---

## Animation Specs

| Interaction | Animation | Duration | DaisyUI Class |
|-------------|-----------|----------|---------------|
| Page load | Fade in | 200ms | `transition-opacity` |
| Card hover | Lift | 150ms | `hover:-translate-y-1` |
| Button click | Scale | 100ms | `active:scale-95` |
| Tab switch | Slide | 200ms | `transition-all` |
| New job | Slide in | 300ms | `transition-transform` |

---

## Accessibility

- All interactive elements keyboard navigable
- Proper heading hierarchy (h1 → h2 → h3)
- `prefers-reduced-motion` respected
- Color not sole indicator (icons + text)
- Alt text for company logos
- High contrast focus rings

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4 |
| Styling | Tailwind CSS + DaisyUI |
| State | Pinia |
| Charts | vue-chartjs |
| Icons | Heroicons |
| Fonts | System UI |
| Build | Vite (via Nuxt) |
| Hosting | Vercel |
