# API Backend

Future FastAPI backend for the job search tracker.

## Planned Endpoints

```
GET  /api/jobs              # List jobs (paginated, filterable)
GET  /api/jobs/{id}         # Get single job
POST /api/jobs/{id}/apply   # Mark as applied
PUT  /api/jobs/{id}/status  # Update status

GET  /api/applications      # List applications
POST /api/applications      # Create application

GET  /api/stats             # Dashboard stats
GET  /api/stats/weekly      # Weekly report
```

## Stack

- **Framework:** FastAPI
- **Database:** SQLite (local) / PostgreSQL (prod)
- **Auth:** JWT (optional for single user)
- **Docs:** Auto-generated OpenAPI

## Running Locally

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs at: http://localhost:8000/docs

## Future Features

- [ ] Webhook for new job notifications
- [ ] GitHub Actions trigger endpoints
- [ ] Integration with frontend Nuxt app
