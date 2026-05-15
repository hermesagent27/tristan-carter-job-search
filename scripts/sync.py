#!/usr/bin/env python3
"""Sync jobs to Obsidian vault for review."""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import List

# Paths
DATA_DIR = Path(__file__).parent.parent / "data" / "jobs"
VAULT_PATH = Path.home() / "Documents" / "Obsidian Vault" / "Job Search"


def load_todays_jobs() -> List[dict]:
    """Load today's scraped jobs."""
    today = datetime.now()
    month_dir = DATA_DIR / today.strftime("%Y-%m")
    filepath = month_dir / f"{today.strftime('%Y-%m-%d')}.json"
    
    if not filepath.exists():
        return []
    
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_markdown(jobs: List[dict]) -> str:
    """Generate Obsidian markdown from jobs."""
    today = datetime.now()
    
    remote_count = sum(1 for j in jobs if j.get("is_remote"))
    
    lines = [
        f"# Job Results - {today.strftime('%B %d, %Y')}",
        "",
        "## Summary",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| **Total** | {len(jobs)} |",
        f"| **Remote** | {remote_count} |",
        f"| **On-site/Hybrid** | {len(jobs) - remote_count} |",
        "",
        "---",
        "",
    ]
    
    for i, job in enumerate(jobs, 1):
        tags = ", ".join(job.get("tags", []))
        salary = f"${job['salary_min']:,}" if job.get("salary_min") else "Not listed"
        exp = job.get("experience_level", "any")
        
        lines.extend([
            f"## {i}. {job['title']}",
            "",
            f"| | |",
            f"|:--|:--|",
            f"| **Company** | {job['company']} |",
            f"| **Location** | {job['location']} |",
            f"| **Role** | {job['role_type'].capitalize()} |",
            f"| **Level** | {exp} |",
            f"| **Salary** | {salary} |",
            f"| **Tags** | {tags} |",
            f"| **Source** | {job['source']} |",
            "",
            f"🔗 [View Job]({job['url']})",
            "",
            "### Quick Actions",
            f"- [ ] Review against requirements",
            f"- [ ] Customize cover letter",
            f"- [ ] Submit application",
            f"- [ ] Log in tracker",
            "",
            "**Notes:**",
            "",
            "",
            "---",
            "",
        ])
    
    return "\n".join(lines)


def generate_application_draft(job: dict, idx: int) -> Path:
    """Create individual application note."""
    company = re.sub(r'[^\w\s-]', '', job['company'])[:15].strip()
    safe_title = re.sub(r'[^\w-]', '-', job['title'])[:30].strip()
    
    filename = f"App-{idx:02d}-{company}-{safe_title}.md"
    
    content = f"""# Application: {job['title']}

| | |
|:---|:---|
| **Company** | {job['company']} |
| **Position** | {job['title']} |
| **Location** | {job['location']} |
| **Role Type** | {job['role_type']} |
| **Level** | {job['experience_level']} |
| **Salary** | ${job['salary_min']:,} | {'Min salary: Not listed'} |
| **Source** | [[{job['source']}]] |
| **Status** | 🔲 **NEW** |

🔗 **Job Link:** [{job['url'][:60]}...]({job['url']})

---

## Application Tracking

- [ ] Research company
- [ ] Customize cover letter
- [ ] Tailor resume (highlight: {', '.join(job.get('tags', [])[:3])})
- [ ] Submit application
- [ ] Follow up after 5-7 days
- [ ] Log response

---

## Cover Letter

Use template: [[Cover Letter Template]]

**Company-specific notes:**

**Role-specific highlights:**

---

## Interview Notes

See: [[Interview Prep Template]]

---

*Applied: ___________*  
*Response: ___________*  
*Interview: ___________*  
*Outcome: ___________*
"""
    
    month_dir = VAULT_PATH / datetime.now().strftime("%Y-%m")
    month_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = month_dir / filename
    filepath.write_text(content, encoding="utf-8")
    
    return filepath


def sync():
    """Main sync function."""
    print("📤 Syncing to Obsidian...")
    
    jobs = load_todays_jobs()
    if not jobs:
        print("  No jobs to sync today.")
        return
    
    VAULT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Create daily summary
    md_content = generate_markdown(jobs)
    today = datetime.now()
    month_dir = VAULT_PATH / today.strftime("%Y-%m")
    month_dir.mkdir(parents=True, exist_ok=True)
    
    summary_file = month_dir / f"Jobs-{today.strftime('%Y-%m-%d')}.md"
    summary_file.write_text(md_content, encoding="utf-8")
    print(f"  ✓ Summary: {summary_file}")
    
    # Create application drafts
    app_files = []
    for i, job in enumerate(jobs, 1):
        app_file = generate_application_draft(job, i)
        app_files.append(app_file)
    
    print(f"  ✓ Created {len(app_files)} application drafts")
    
    # Update daily log
    log_file = VAULT_PATH / "Daily Log.md"
    log_entry = f"- [[Jobs-{today.strftime('%Y-%m-%d')}|{today.strftime('%Y-%m-%d')}]] - {len(jobs)} jobs found\n"
    
    if log_file.exists():
        log_content = log_file.read_text(encoding="utf-8")
        if today.strftime('%Y-%m-%d') not in log_content:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(log_entry)
    else:
        log_file.write_text(f"# Job Search Daily Log\n\n{log_entry}", encoding="utf-8")
    
    print("  ✓ Updated daily log")
    print(f"\n✅ Sync complete!")


if __name__ == "__main__":
    sync()
