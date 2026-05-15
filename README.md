# 🎯 Tristan Carter Job Search

> **Goal:** Land a developer/support role after Amazon delivery → full-time dev transition
> **Stack:** Vue/Nuxt, frontend + light backend  
> **Status:** Active search | Weekly tracking

---

## 📂 Repo Structure

```
tristan-carter-job-search/
├── 📁 data/
│   ├── 📁 jobs/            # Raw scraped jobs (YYYY-MM/YYYY-MM-DD.json)
│   ├── 📁 applications/    # Application tracking (YYYY/active.json)
│   ├── 📁 companies/       # Company research (slug.json)
│   └── 📁 templates/       # Reusable docs
├── 📁 scripts/             # Python automation
│   ├── scraper.py         # Daily job scrape
│   ├── sync.py            # Sync to Obsidian
│   ├── report.py          # Weekly reports
│   └── db.py              # SQLite interface
├── 📁 api/                 # FastAPI backend (roadmap)
├── 📁 frontend/            # Nuxt UI (roadmap - your stack!)
└── 📁 docs/                # Architecture & planning
```

---

## 🚀 Quick Start

```bash
# 1. Clone & enter
cd ~/tristan-carter-job-search

# 2. Install deps
pip install -r requirements.txt

# 3. Run today's job scrape
python scripts/scraper.py

# 4. Sync to Obsidian (optional)
python scripts/sync.py

# 5. Generate weekly report
python scripts/report.py --weekly
```

---

## 📊 Data Model

### Job Listing
```json
{
  "id": "remoteok-12345",
  "title": "Frontend Developer",
  "company": "RemoteCorp",
  "location": "Remote",
  "salary_min": 60000,
  "salary_max": 80000,
  "description": "...",
  "url": "...",
  "source": "RemoteOK",
  "date_posted": "2025-01-15",
  "date_scraped": "2025-01-15",
  "tags": ["vue", "javascript", "remote"],
  "status": "new"
}
```

### Application
```json
{
  "id": "app-001",
  "job_id": "remoteok-12345",
  "company": "RemoteCorp",
  "position": "Frontend Developer",
  "date_applied": "2025-01-16",
  "status": "applied|interview|offer|rejected|ghosted",
  "notes": "...",
  "follow_up_dates": ["2025-01-23"],
  "contacts": []
}
```

See [`docs/data-model.md`](docs/data-model.md) for full schema.

---

## 🔄 Daily Workflow

| Time | Action | Command |
|------|--------|---------|
| Morning | Scrape new jobs | `python scripts/scraper.py` |
| During day | Review & apply | Update applications/*.json |
| Evening | Sync to Obsidian | `python scripts/sync.py` |
| Sunday | Weekly report | `python scripts/report.py --weekly` |

---

## 📈 Goals & Metrics

- **Target:** 100 applications by end of month
- **Apply rate:** 5-10 jobs/week
- **Response rate:** Track % (goal: 10-15%)

---

## 🗺️ Roadmap

- [x] SQLite backend for jobs
- [x] Daily RSS scraping
- [ ] FastAPI + sync endpoint
- [ ] Nuxt frontend dashboard
- [ ] AI-powered cover letter generator

---

## 📄 License

MIT - Fork and adapt for your search!
