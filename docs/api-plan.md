# API Development Plan

## Phase 1: Core REST API (MVP)

### Authentication
- **Single user:** API key in header (simple, local only)
- **Future:** JWT if multi-user

### Endpoints

#### Jobs
```
GET    /jobs
       ?status=new&role=frontend&remote=true&tag=vue
       Response: { jobs: [], total: int, page: int }

GET    /jobs/{id}
       Response: Job object

PATCH  /jobs/{id}/status
       Body: { status: "reviewed" | "applied" | "archived" }

POST   /jobs/{id}/apply
       Body: { date_applied, notes }
       Response: { application_id }
```

#### Applications
```
GET    /applications
       ?status=active&company=XYZ
       Response: { applications: [] }

GET    /applications/{id}
       Response: Application + Job details

POST   /applications
       Body: { job_id, ... }

PATCH  /applications/{id}/status
       Body: { status, notes }

POST   /applications/{id}/note
       Body: { content }
```

#### Stats
```
GET    /stats
       Response: {
         total_jobs: int,
         jobs_this_week: int,
         active_applications: int,
         response_rate: float,
         by_role: { role: count },
         by_source: { source: count }
       }

GET    /stats/timeline
       ?start=2025-01-01&end=2025-01-31
       Response: { daily: [{ date, jobs, apps }] }
```

#### Sync
```
POST   /sync/now
       Triggers scraper + returns new jobs

POST   /sync/import
       Body: JSON file upload
       Imports jobs into DB
```

---

## Phase 2: Enhancements

### WebSocket (Real-time)
```
WS     /ws/jobs
       Pushes new jobs when scraper runs
```

### Search
```
GET    /search?q=vue+frontend&remote=true
       Full-text search on title/description
```

### Export
```
GET    /export/jobs?format=csv
GET    /export/applications?format=csv
```

---

## Phase 3: GitHub Actions Integration

GitHub Actions will:
1. Run scraper daily
2. Commit new jobs to `data/jobs/`
3. POST to `/sync/import` (if API server running)
4. Trigger notification webhook

```yaml
# In workflow
- name: Notify API
  run: |
    curl -X POST https://api.example.com/sync/import \
      -H "Authorization: Bearer $API_KEY"
```

---

## Stack Notes

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | FastAPI | Fast, modern, good docs |
| ORM | SQLModel | Type-safe SQL with Pydantic |
| DB | SQLite (local) | Zero setup, good for single user |
| Validation | Pydantic | Built into FastAPI |
| Testing | pytest + httpx | Standard Python testing |

---

## File Structure

```
api/
├── main.py              # FastAPI app
├── routers/
│   ├── jobs.py          # /jobs/* endpoints
│   ├── applications.py  # /applications/*
│   ├── stats.py         # /stats/*
│   └── sync.py          # /sync/*
├── models.py            # SQLModel schemas
├── database.py          # DB connection
├── config.py            # Settings
└── requirements.txt
```

---

## Future Ideas

- [ ] GraphQL endpoint for complex queries
- [ ] Rate limiting (if public)
- [ ] Job alert subscriptions (email/webhook)
- [ ] AI-powered cover letter suggestions via `/jobs/{id}/suggest`
- [ ] Interview prep generator via `/companies/{slug}/interview-prep`
