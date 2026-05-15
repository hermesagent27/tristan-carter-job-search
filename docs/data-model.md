# Data Model Documentation

## Core Entities

### Job (Job Listing)

Scraped from RSS feeds, represents a single job posting.

**Schema:** `data/schema/job.json`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique: `{source}-{hash}` |
| `title` | string | Job title |
| `company` | string | Company name |
| `location` | string | "Remote", "City, ST", etc |
| `is_remote` | boolean | Remote allowed |
| `salary_min/max` | int | USD annual |
| `description` | string | Full post text |
| `url` | string | Link to posting |
| `source` | enum | RSS feed origin |
| `date_posted` | date | From post |
| `date_scraped` | date | When we found it |
| `tags` | string[] | Matched keywords |
| `experience_level` | enum | entry/junior/mid/senior/any |
| `role_type` | enum | frontend/backend/etc |
| `flags.match_score` | int | 0-100 relevance |
| `status` | enum | new/reviewed/applied/archived |

### Application

Your application to a job (tracked separately).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `app-{increment}` |
| `job_id` | FK | Links to Job |
| `company` | string | Redundant (denormalized) |
| `position` | string | Position applied |
| `date_applied` | date | When you applied |
| `status` | enum | applied/interview/offer/etc |
| `notes` | string | Interview feedback |
| `contacts` | JSON | Recruiter, hiring mgr |
| `follow_up_dates` | date[] | Reminders |

### Company

Research data on companies you're interested in.

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | URL-safe name |
| `name` | string | Full name |
| `website` | string | URL |
| `glassdoor_rating` | float | 0-5 stars |
| `tech_stack` | string[] | From research |
| `interview_process` | string[] | Steps described |
| `salary_benchmarks` | object | Levels.fyi data |
| `notes` | string | Personal notes |
| `applications_count` | int | How many apps |

---

## Status Flows

### Job Status
```
new → reviewed → applied → [archived]
                          ↓
                         [Application created]
```

### Application Status
```
applied → phone_screen → technical → onsite → offer → hired
   ↓
rejected (at any stage)
   ↓
ghosted (>30 days no response)
```

---

## File Storage

```
data/
├── jobs/              # One JSON array per day
│   └── YYYY-MM/
│       └── YYYY-MM-DD.json
├── applications/      # Active + archived
│   └── YYYY/
│       ├── active.json
│       └── completed.json
└── companies/         # One file per company
    └── slug.json
```

---

## SQLite Schema

See `scripts/db.py` for full CREATE TABLE statements.

Key indexes:
- `idx_jobs_status` - For filtering
- `idx_jobs_date` - For date range queries
- `idx_apps_status` - Application pipeline

---

## Validation

Jobs are validated against `data/schema/job.json` (JSON Schema) before storage.

Validation rules:
- Required fields: id, title, company, url, source, date_scraped
- URL must be valid URI format
- date_scraped must be YYYY-MM-DD
- tags must be array of strings
