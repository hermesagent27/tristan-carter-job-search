# API Specification (Nuxt Nitro Server Routes)

This document defines the API for the job tracker — implemented as Nuxt Nitro server routes instead of FastAPI.

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://your-app.vercel.app/api
```

---

## Endpoints

### Jobs

#### `GET /api/jobs`

Fetch jobs with optional filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by application status: `post`, `applied`, `interview`, `offer` |
| `role` | string | Filter by role type: `frontend`, `backend`, `fullstack` |
| `remote` | `true`\|`false` | Remote jobs only |
| `favorites` | `true`\|`false` | Favorited jobs only |
| `hidden` | `true`\|`false` | Include hidden jobs (default: false) |
| `sort` | `date`\|`salary`\|`relevance` | Sort order |

**Response:**
```json
{
  "jobs": [
    {
      "id": "remoteok-abc123",
      "title": "Frontend Developer",
      "company": "RemoteCorp",
      "location": "Remote",
      "is_remote": true,
      "salary_min": 60000,
      "salary_max": 80000,
      "description": "...",
      "url": "...",
      "source": "RemoteOK",
      "date_posted": "2025-01-15",
      "tags": ["vue", "javascript"],
      "is_favorite": false,
      "is_hidden": false,
      "role_type": "frontend"
    }
  ],
  "total": 47,
  "filters_applied": { "status": "post", "remote": "true" }
}
```

---

#### `GET /api/jobs/[id]`

Get single job by ID.

**Response:**
```json
{
  "id": "remoteok-abc123",
  "title": "Frontend Developer",
  ...
}
```

---

#### `PATCH /api/jobs/[id]`

Update job metadata (favorite, hide).

**Body:**
```json
{
  "is_favorite": true,
  "is_hidden": false
}
```

**Response:**
```json
{
  "success": true,
  "job": { ... }
}
```

---

### Applications

#### `GET /api/applications`

List all applications.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `job_id` | string | Filter by job |

**Response:**
```json
{
  "applications": [
    {
      "id": "app-001",
      "job_id": "remoteok-abc123",
      "status": "applied",
      "date_applied": "2025-01-16",
      "cover_letter": "...",
      "notes": "...",
      "updated_at": "2025-01-16T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/applications`

Create a new application.

**Body:**
```json
{
  "job_id": "remoteok-abc123",
  "status": "applied",
  "cover_letter": "Dear Hiring Manager...",
  "notes": "Applied via company website"
}
```

**Response:**
```json
{
  "success": true,
  "application": { ... }
}
```

---

#### `PATCH /api/applications/[id]`

Update application (status, notes, cover letter).

**Body:**
```json
{
  "status": "interview",
  "notes": "Phone screen scheduled for Monday"
}
```

**Response:**
```json
{
  "success": true,
  "application": { ... }
}
```

---

#### `DELETE /api/applications/[id]`

Remove an application.

**Response:**
```json
{
  "success": true
}
```

---

### Stats

#### `GET /api/stats`

Dashboard statistics.

**Response:**
```json
{
  "total_jobs": 156,
  "jobs_this_week": 23,
  "total_applications": 12,
  "by_status": {
    "post": 144,
    "applied": 8,
    "interview": 3,
    "offer": 1
  },
  "by_role": {
    "frontend": 89,
    "fullstack": 45,
    "backend": 22
  },
  "salary_range": {
    "min": 45000,
    "max": 180000,
    "avg": 82000
  },
  "by_source": {
    "RemoteOK": 67,
    "WeWorkRemotely": 45,
    "JSRemotely": 44
  }
}
```

---

#### `GET /api/stats/timeline`

Time-series data for charts.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `start` | date | Start date (YYYY-MM-DD) |
| `end` | date | End date (YYYY-MM-DD) |
| `metric` | `jobs`\|`applications`\|`interviews`\|`offers` | What to count |

**Response:**
```json
{
  "data": [
    { "date": "2025-01-15", "count": 5 },
    { "date": "2025-01-16", "count": 8 }
  ]
}
```

---

## Implementation

All endpoints are Nitro server routes in `frontend/server/api/`:

```
server/api/
├── jobs.get.ts           # GET /api/jobs
├── jobs/
│   └── [id]
│       ├── get.ts        # GET /api/jobs/:id
│       └── patch.ts      # PATCH /api/jobs/:id
├── applications.get.ts   # GET /api/applications
├── applications.post.ts  # POST /api/applications
├── applications/
│   └── [id]
│       ├── get.ts        # GET /api/applications/:id
│       ├── patch.ts      # PATCH /api/applications/:id
│       └── delete.ts     # DELETE /api/applications/:id
└── stats.get.ts          # GET /api/stats
```

---

## Error Responses

All errors return JSON with consistent format:

```json
{
  "success": false,
  "error": "Not found",
  "message": "Job with id 'xyz' does not exist"
}
```

**Status Codes:**
| Code | Used When |
|------|-----------|
| 200 | Success |
| 400 | Bad request (invalid params) |
| 404 | Resource not found |
| 500 | Server error (GitHub API failure, etc) |

---

## Data Storage

- **Source of truth:** GitHub repo JSON files
- **Read:** Server routes fetch from GitHub API
- **Write:** Server routes commit changes back to GitHub
- **Caching:** 5-minute in-memory cache to avoid rate limits

---

## Migration from FastAPI

| FastAPI Concept | Nitro Equivalent |
|-----------------|------------------|
| `@app.get("/jobs")` | `jobs.get.ts` |
| `@app.patch("/jobs/{id}")` | `jobs/[id].patch.ts` |
| `Depends(get_db)` | `useRuntimeConfig()` for secrets |
| Pydantic models | TypeScript interfaces |
| SQLAlchemy | GitHub API + JSON |
