# UI Specification - Nuxt Frontend

## Design Philosophy

- **Clean:** Lots of whitespace, clear hierarchy
- **Fast:** Instant navigation (your local data!)
- **Focused:** No fluff, just job search power tools
- **Personal:** Tailored to Vue/Nuxt stack

## Color Palette

```
Primary:    #6366f1 (Indigo-500)   // Main actions
Secondary:  #22c55e (Green-500)    // Success, matches
Accent:     #f59e0b (Amber-500)    // Warnings, highlights
Danger:     #ef4444 (Red-500)      // Rejections, deletions

Background: #f8fafc (Slate-50)
Surface:    #ffffff (White)
Text:       #1e293b (Slate-800)
Muted:      #64748b (Slate-500)

// Vue/Nuxt specific highlight
Vue Green:  #42b883
```

## Typography

- **Headings:** Inter or system-ui
- **Body:** Inter (same, clean)
- **Mono:** JetBrains Mono (for code tags)

---

## Page Designs

### Dashboard (`/`)

```
+--------------------------------------------------+
|  🎯 TRISTAN'S JOB HUNT                    [⚙️]  |
+--------------------------------------------------+
|                                                  |
|  +-------------------+  +-------------------+   |
|  |  📋 Jobs This Week |  |  📝 Applications  |   |
|  |        23         |  |                    |   |
|  |  +5 from yesterday|  |  Active: 12       |   |
|  +-------------------+  |  Interviews: 3     |   |
|                         |  Offers: 1        |   |
|  +-------------------+  +-------------------+   |
|  |  📈 Response Rate |                           |
|  |      15%          |  [Scan for Jobs] button  |
|  +-------------------+                           |
|                                                  |
|  Recent Jobs                    [View All →]    |
|  +---------------------------------------------+  |
|  | 🟢 Frontend Dev @ RemoteCorp    Vue ↑ 8.5  |  |
|  |    Remote | $65k-80k | New                   |  |
|  +---------------------------------------------+  |
|  | 🟡 Full Stack @ StartupCo       React + Node|  |
|  |    Hybrid | Salary TBD | Applied 2d ago     |  |
|  +---------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

**Components:**
- `<StatCard :icon :label :value :change />`
- `<JobCard compact :job />`
- `<QuickActionBar />`

### Jobs List (`/jobs`)

```
+--------------------------------------------------+
|  Jobs                              [+ Filters]     |
|  ──────────────────────────────────────────────    |
|  [🔍 Search...    ] [All Roles ▼] [Remote ☑️]     |
|                                                  |
|  Found 47 matching jobs                          |
|                                                  |
|  Sort: [Relevance ▼]    View: [Grid ▼|List ▼]    |
|                                                  |
|  ┌────────────────┐ ┌────────────────┐          |
|  | 🏢  |          | | 🏢  |          |          |
|  |     | Company  | |     | Company  |          |
|  | Vue | ─────────| | Nuxt| ─────────|          |
|  | ⭐  | Position | | ⭐  | Position |          |
|  | 8.5 | Remote   | | 9.2 | Hybrid   |          |
|  |     | $60k-75k| |     | $70k+    |          |
|  |     | [Apply]  | |     | [Saved]  |          |
|  └────────────────┘ └────────────────┘          |
|                                                  |
|  [Previous] Page 1 of 5 [Next]                   |
+--------------------------------------------------+
```

**Filters:**
- Role type (chips)
- Experience level
- Salary range (slider)
- Remote only toggle
- Tags (Vue, Nuxt, React, etc.)

**JobCard Modes:**
- Grid: Company logo, score badge, quick actions
- List: More detail, inline apply button

### Job Detail (`/jobs/:id`)

```
+--------------------------------------------------+
|  [← Back to Jobs]                                |
|                                                  |
|  🏢 RemoteCorp                              [⭐️] |
|  Frontend Developer (Vue.js)                     |
|  Remote • Full-time • $65,000 - $80,000        |
|                                                  |
|  Match Score: ████████░░ 85%                    |
|  Tags: Vue, Nuxt, JavaScript, Tailwind, Remote   |
|                                                  |
|  [📝 Apply] [📋 Copy Link] [🗑️ Hide]            |
|                                                  |
|  ─── Description ───────────────────────────     |
|                                                  |
|  We're looking for a frontend developer...       |
|                                                  |
|  ─── Your Notes ─────────────────────────────     |
|  [Type notes here...                    ]       |
|  [+ Add Note]                                    |
|                                                  |
|  ─── Application ────────────────────────────     |
|  [Start Application →]                            |
|                                                  |
+--------------------------------------------------+
```

### Applications (`/applications`)

```
+--------------------------------------------------+
|  My Applications                                   |
|                                                  |
|  [Applied ▼] [Companies ▼] [+ Add Manually]    |
|                                                  |
|  Kanban View | List View                         |
|                                                  |
|  ┌─────────┐  ┌─────────┐  ┌─────────┐          |
|  | Applied |  | Phone   |  | Offer   |          |
|  |   12    |  |  Screen |  |   1     |          |
|  ├─────────┤  ├─────────┤  ├─────────┤          |
|  | Remote- |  | TechGi- |  | Startup |          |
|  |  Corp   |  |   ant   |  |   Co    |          |
|  | Frontend|  | Support |  | Fullstack|          |
|  | Applied |  | 3d ago  |  | $75k    |          |
|  | 2d ago  |  |         |  |         |          |
|  ├─────────┤  ├─────────┤  ├─────────┤          |
|  | ...     |  | ...     |  |         |          |
|  └─────────┘  └─────────┘  └─────────┘          |
+--------------------------------------------------+
```

**Kanban Columns:**
Applied → Phone Screen → Interview → Onsite → Offer → Rejected/Ghosted

### Stats (`/stats`)

```
+--------------------------------------------------+
|  📊 Stats & Analytics                              |
|                                                  |
|  [Week] [Month] [Year] [Custom]                  |
|                                                  |
|  +---------------+ +---------------+            |
|  |  Applications | |   Response    |            |
|  |  over time    | |     Rate      |            |
|  |               | |               |            |
|  |    📈         | |     15%       |            |
|  +---------------+ +---------------+            |
|                                                  |
|  +-------------------------------------------+   |
|  |  Source Breakdown                         |   |
|  |  ████████ RemoteOK      45%             |   |
|  |  ████     WeWorkRemote  25%             |   |
|  |  ██       JSRemotely    15%             |   |
|  |  ██       Other         15%             |   |
|  +-------------------------------------------+   |
|                                                  |
|  +---------------+ +---------------+            |
|  |  Role Types   | |  Salary      |            |
|  |               | |   Trend      |            |
|  +---------------+ +---------------+            |
+--------------------------------------------------+
```

---

## Component Inventory

### UI Primitives
- `<Button variant="primary|secondary|danger">`
- `<Input icon placeholder />`
- `<Select options />`
- `<Checkbox label />`
- `<Card padding hoverable />`
- `<Badge variant color />`

### Domain Components
- `<JobCard :job variant="compact|full" />`
- `<MatchScore :score />` (animated ring)
- `<StatusBadge :status />` (color-coded)
- `<SalaryRange :min :max />`
- `<CompanyLogo :name />` (placeholder)
- `<ApplicationTimeline :status />`
- `<KanbanBoard :columns />`

### Layout
- `<AppSidebar />` - Navigation
- `<TopBar />` - Search + profile
- `<PageContainer />` - Consistent padding
- `<EmptyState icon title description />`

---

## Responsive Breakpoints

```js
screens: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
}
```

**Mobile adaptations:**
- Sidebar → Bottom nav
- Grid → Single column
- Kanban → Vertical list
- Stats → Stacked charts

---

## Animation Specs

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Page load | Fade in | 200ms | ease-out |
| Job card hover | Lift + shadow | 150ms | ease-in-out |
| Status change | Color transition | 200ms | ease |
| New job appear | Slide down | 300ms | ease-out |
| Kanban drag | Scale 1.02 | 100ms | ease |

---

## Accessibility Checklist

- [ ] All interactive elements keyboard navigable
- [ ] Color alone doesn't indicate status (icons + text)
- [ ] `prefers-reduced-motion` respected
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text for company logos
- [ ] WCAG AA contrast ratios

---

## Tech Integration

### Data Layer
- Use Nuxt's `$fetch` for API calls
- Pinia store for global state (filters, auth)
- LocalStorage for UI preferences (theme, view mode)

### Charts
- VueChart.js for stats
- Client-side only (heavy)

### Icons
- Heroicons (solid/outline variants)
- Custom icons for tags ( Vue logo, etc.)
