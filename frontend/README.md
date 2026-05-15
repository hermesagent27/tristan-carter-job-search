# Frontend Dashboard

Future Nuxt 3 UI for job search management.

## Vision

A clean dashboard to:
- 📊 Visualize search progress
- 📋 Browse and filter jobs
- ✍️ Track applications
- 📈 View weekly/monthly stats
- 🔔 Get alerts for new matches

## Tech Stack

- **Framework:** Nuxt 3
- **Styling:** Tailwind CSS
- **Data:** Fetch from local SQLite via API
- **Charts:** Chart.js / ApexCharts
- **Icons:** Heroicons

## Planned Pages

```
/
├── Dashboard         # Stats + quick actions
├── Jobs             # Browse/search listings
│   └── [id]         # Job detail
├── Applications     # Track applications
├── Stats            # Charts & analytics
└── Settings         # Preferences
```

## Component Ideas

- `<JobCard />` - Preview with quick actions
- `<ApplicationTimeline />` - Status progression
- `<StatsChart />` - Weekly trends
- `<MatchScore />` - Vue/Nuxt relevance badge

## Development

```bash
# Once API is ready
npx nuxi@latest init frontend
cd frontend
npm install
npm run dev
```

## Integration

Will connect to:
- Local FastAPI backend (`/api`)
- GitHub data sync (Actions)
- Potential webhook for daily alerts

> **Note:** This is a roadmap directory. Implementation TBD once backend API is ready.
