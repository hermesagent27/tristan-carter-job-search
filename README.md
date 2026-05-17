# 🎯 Tristan Carter Job Search

> **Goal:** Land a developer/support role after Amazon delivery → full-time dev transition  
> **Stack:** Vue/Nuxt 4, Tailwind, DaisyUI  
> **Status:** Active search | Weekly tracking

---

## 📂 Repo Structure

```
tristan-carter-job-search/
├── 📁 data/
│   ├── 📁 jobs/            # Raw scraped jobs (YYYY-MM/YYYY-MM-DD.json)
│   ├── 📁 applications/    # Application tracking (applications.json)
│   └── 📁 templates/       # Reusable docs
├── 📁 scripts/             # Python automation
│   ├── scraper.py         # Daily job scrape
│   └── report.py          # Weekly reports
├── 📁 frontend/            # Nuxt 4 full-stack app (SSR + API routes)
│   ├── app/               # Nuxt 4 app directory
│   ├── server/            # Nitro API routes (replaces FastAPI)
│   └── ...
├── 📁 .github/
│   └── workflows/         # Daily scrape job
└── 📁 docs/                # Architecture & planning
```

---

## 🏗️ Architecture (Nuxt 4 Full-Stack)

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Single Deploy)                    │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │   Nuxt 4 UI     │◄──────►│   Nitro Server Routes       │ │
│  │   (Vue/TW)      │        │   /api/jobs, /api/apps      │ │
│  └─────────────────┘        └────────────┬────────────────┘ │
│                                          │                  │
└──────────────────────────────────────────┼──────────────────┘
                                           │
                     ┌─────────────────────┘
                     │
           ┌─────────▼──────────┐
           │   GitHub Repo      │
           │   (JSON source)    │
           └────────────────────┘
```

**Why Nuxt-only?**
- Single codebase, single deploy
- Server routes replace FastAPI (read/write JSON on server)
- No persistent DB needed — GitHub JSON is source of truth
- Single-user → no auth complexity

---

## 🚀 Quick Start

```bash
# 1. Clone & enter
cd ~/tristan-carter-job-search

# 2. Run today's job scrape
python scripts/scraper.py

# 3. Start Nuxt dev server
cd frontend
npm install
npm run dev
```

---

## 📊 Data Model (JSON-Based)

### Job Listing
```json
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
  "date_scraped": "2025-01-15",
  "tags": ["vue", "javascript", "remote"],
  "is_favorite": false,
  "is_hidden": false,
  "role_type": "frontend"
}
```

### Application
```json
{
  "id": "app-001",
  "job_id": "remoteok-abc123",
  "status": "applied",
  "date_applied": "2025-01-16",
  "cover_letter": "...",
  "notes": "...",
  "updated_at": "2025-01-16T10:00:00Z"
}
```

---

## 🔄 Daily Workflow

| Time | Action | Where |
|------|--------|-------|
| 8 AM (auto) | Scrape new jobs | GitHub Actions → commits to `data/jobs/` |
| Manual | Review & apply | Nuxt app at `/` |
| Manual | Track status | Change tabs: Post → Applied → Interview → Offer |

---

## 📈 Goals & Metrics

- **Target:** 100 applications by end of month
- **Apply rate:** 5-10 jobs/week
- **Response rate:** Track % (goal: 10-15%)

---

## 🗺️ Roadmap

- [x] JSON-based job storage
- [x] Daily RSS scraping via cron
- [ ] Nuxt 4 full-stack app (pages + API routes)
- [ ] Job browsing with filters (role, salary, remote)
- [ ] Application tracking (status pipeline)
- [ ] Dashboard with customizable graphs
- [ ] Cover letter & application answers generator

---

## 📄 License

MIT - Fork and adapt for your search!
