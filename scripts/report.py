#!/usr/bin/env python3
"""Generate weekly/monthly reports from job search data."""

import argparse
import json
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "jobs"
APPS_DIR = Path(__file__).parent.parent / "data" / "applications"


def load_jobs_in_range(start_date: datetime, end_date: datetime) -> list:
    """Load all jobs in date range."""
    jobs = []
    current = start_date
    
    while current <= end_date:
        month_dir = DATA_DIR / current.strftime("%Y-%m")
        filepath = month_dir / f"{current.strftime('%Y-%m-%d')}.json"
        
        if filepath.exists():
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    day_jobs = json.load(f)
                    for job in day_jobs:
                        job["_date"] = current.strftime("%Y-%m-%d")
                    jobs.extend(day_jobs)
            except Exception as e:
                print(f"  Error loading {filepath}: {e}")
        
        current += timedelta(days=1)
    
    return jobs


def generate_daily_report(date: datetime = None):
    """Generate report for single day."""
    date = date or datetime.now()
    
    month_dir = DATA_DIR / date.strftime("%Y-%m")
    filepath = month_dir / f"{date.strftime('%Y-%m-%d')}.json"
    
    if not filepath.exists():
        print(f"No data for {date.strftime('%Y-%m-%d')}")
        return
    
    with open(filepath, "r", encoding="utf-8") as f:
        jobs = json.load(f)
    
    if not jobs:
        print(f"## Daily Report - {date.strftime('%Y-%m-%d')}\n")
        print("No jobs found today.")
        return
    
    # Stats
    remote = sum(1 for j in jobs if j.get("is_remote"))
    by_role = defaultdict(int)
    by_source = defaultdict(int)
    by_level = defaultdict(int)
    
    for job in jobs:
        by_role[job.get("role_type", "unknown")] += 1
        by_source[job.get("source", "unknown")] += 1
        by_level[job.get("experience_level", "unknown")] += 1
    
    print(f"## Daily Report - {date.strftime('%Y-%m-%d')}\n")
    print(f"**Total Jobs:** {len(jobs)}")
    print(f"**Remote:** {remote} | **On-site/Hybrid:** {len(jobs) - remote}\n")
    
    print("### By Role")
    for role, count in sorted(by_role.items(), key=lambda x: -x[1]):
        print(f"  - {role}: {count}")
    
    print("\n### By Source")
    for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  - {source}: {count}")
    
    print("\n### By Level")
    for level, count in sorted(by_level.items(), key=lambda x: -x[1]):
        print(f"  - {level}: {count}")
    
    print("\n### Top Matches")
    for i, job in enumerate(jobs[:5], 1):
        tags = ", ".join(job.get("tags", [])[:3])
        print(f"  {i}. {job['title'][:50]} @ {job['company'][:20]} ({tags})")


def generate_weekly_report(end_date: datetime = None):
    """Generate 7-day report."""
    end_date = end_date or datetime.now()
    start_date = end_date - timedelta(days=6)
    
    jobs = load_jobs_in_range(start_date, end_date)
    
    print(f"## Weekly Report ({start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')})\n")
    
    if not jobs:
        print("No jobs found this week.")
        return
    
    # Stats
    remote = sum(1 for j in jobs if j.get("is_remote"))
    by_day = defaultdict(int)
    by_role = defaultdict(int)
    by_source = defaultdict(int)
    high_match = [j for j in jobs if "vue" in str(j.get("tags", [])) or "nuxt" in str(j.get("tags", []))]
    
    for job in jobs:
        by_day[job.get("_date", "unknown")] += 1
        by_role[job.get("role_type", "unknown")] += 1
        by_source[job.get("source", "unknown")] += 1
    
    print(f"**Total Jobs Scraped:** {len(jobs)}")
    print(f"**Remote:** {remote} ({100*remote/len(jobs):.1f}%)")
    print(f"**Vue/Nuxt specific:** {len(high_match)}\n")
    
    print("### Daily Breakdown")
    for day, count in sorted(by_day.items()):
        print(f"  - {day}: {count} jobs")
    
    print("\n### Role Distribution")
    for role, count in sorted(by_role.items(), key=lambda x: -x[1]):
        pct = 100 * count / len(jobs)
        print(f"  - {role}: {count} ({pct:.1f}%)")
    
    print("\n### Sources")
    for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  - {source}: {count}")
    
    print("\n### 🎯 Highlights (Vue/Nuxt)")
    if high_match:
        for i, job in enumerate(high_match[:5], 1):
            print(f"  {i}. {job['title']} @ {job['company']}")
    else:
        print("  No Vue/Nuxt roles found this week.")


def generate_monthly_report(year_month: str = None):
    """Generate monthly report."""
    if year_month:
        year, month = year_month.split("-")
        month_dir = DATA_DIR / f"{year}-{month}"
    else:
        now = datetime.now()
        month_dir = DATA_DIR / now.strftime("%Y-%m")
    
    if not month_dir.exists():
        print(f"No data for {month_dir.name}")
        return
    
    jobs = []
    for filepath in month_dir.glob("*.json"):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                jobs.extend(json.load(f))
        except Exception as e:
            pass
    
    print(f"## Monthly Report - {month_dir.name}\n")
    print(f"**Total Jobs:** {len(jobs)}")
    
    if jobs:
        by_role = defaultdict(int)
        by_level = defaultdict(int)
        remote = sum(1 for j in jobs if j.get("is_remote"))
        
        for job in jobs:
            by_role[job.get("role_type", "unknown")] += 1
            by_level[job.get("experience_level", "unknown")] += 1
        
        print(f"**Remote:** {remote} ({100*remote/len(jobs):.1f}%)")
        print(f"**Avg per day:** {len(jobs)/30:.1f}")
        
        print("\n### By Role")
        for role, count in sorted(by_role.items(), key=lambda x: -x[1]):
            print(f"  - {role}: {count}")


def main():
    parser = argparse.ArgumentParser(description="Generate job search reports")
    parser.add_argument("--daily", action="store_true", help="Generate daily report")
    parser.add_argument("--weekly", action="store_true", help="Generate weekly report")
    parser.add_argument("--monthly", type=str, nargs="?", const="current", help="Generate monthly report (YYYY-MM)")
    
    args = parser.parse_args()
    
    if not any([args.daily, args.weekly, args.monthly]):
        args.daily = True  # Default to daily
    
    if args.daily:
        generate_daily_report()
    elif args.weekly:
        generate_weekly_report()
    elif args.monthly:
        generate_monthly_report(None if args.monthly == "current" else args.monthly)


if __name__ == "__main__":
    main()
