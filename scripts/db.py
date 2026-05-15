#!/usr/bin/env python3
"""SQLite interface for job search data."""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "local" / "database.db"
DATA_DIR = Path(__file__).parent.parent / "data" / "jobs"

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    is_remote BOOLEAN DEFAULT 1,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    url TEXT UNIQUE NOT NULL,
    source TEXT,
    date_posted DATE,
    date_scraped DATE NOT NULL,
    tags TEXT, -- JSON array
    experience_level TEXT,
    role_type TEXT,
    employment_type TEXT,
    status TEXT DEFAULT 'new',
    application_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES jobs(id),
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    date_applied DATE,
    status TEXT DEFAULT 'applied', -- applied, phone, interview, offer, rejected, ghosted
    notes TEXT,
    contacts TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date_scraped);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
"""


@contextmanager
def get_db():
    """Get database connection."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize database schema."""
    with get_db() as conn:
        conn.executescript(SCHEMA)
        conn.commit()
    print(f"✅ Database initialized at {DB_PATH}")


def job_to_db(job: dict) -> dict:
    """Prepare job dict for DB insertion."""
    return {
        "id": job["id"],
        "title": job["title"],
        "company": job["company"],
        "location": job.get("location", "Remote"),
        "is_remote": int(job.get("is_remote", True)),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "description": job.get("description", ""),
        "url": job["url"],
        "source": job.get("source", ""),
        "date_posted": job.get("date_posted"),
        "date_scraped": job.get("date_scraped", datetime.now().strftime("%Y-%m-%d")),
        "tags": json.dumps(job.get("tags", [])),
        "experience_level": job.get("experience_level", "any"),
        "role_type": job.get("role_type", "other"),
        "employment_type": job.get("employment_type", "full-time"),
        "status": job.get("status", "new"),
        "application_id": job.get("application_id"),
    }


def import_from_json(filepath: Path = None):
    """Import jobs from JSON file(s) to SQLite."""
    if filepath:
        files = [filepath]
    else:
        # Import all JSON files
        files = list(DATA_DIR.glob("**/*.json"))
    
    imported = 0
    skipped = 0
    
    with get_db() as conn:
        for filepath in files:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    jobs = json.load(f)
                
                for job in jobs:
                    try:
                        data = job_to_db(job)
                        conn.execute("""
                            INSERT OR IGNORE INTO jobs 
                            (id, title, company, location, is_remote, salary_min, salary_max,
                             description, url, source, date_posted, date_scraped, tags,
                             experience_level, role_type, employment_type, status)
                            VALUES 
                            (:id, :title, :company, :location, :is_remote, :salary_min, :salary_max,
                             :description, :url, :source, :date_posted, :date_scraped, :tags,
                             :experience_level, :role_type, :employment_type, :status)
                        """, data)
                        imported += 1
                    except sqlite3.IntegrityError:
                        skipped += 1
                
                print(f"  ✓ {filepath.name}: {len(jobs)} jobs")
            except Exception as e:
                print(f"  ✗ {filepath.name}: {e}")
        
        conn.commit()
    
    print(f"\n✅ Imported {imported} jobs, skipped {skipped} duplicates")


def get_stats():
    """Print database stats."""
    with get_db() as conn:
        # Total jobs
        total = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        
        # By status
        status_counts = conn.execute(
            "SELECT status, COUNT(*) FROM jobs GROUP BY status"
        ).fetchall()
        
        # By role type
        role_counts = conn.execute(
            "SELECT role_type, COUNT(*) FROM jobs GROUP BY role_type ORDER BY COUNT(*) DESC"
        ).fetchall()
        
        # Recent jobs
        recent = conn.execute(
            "SELECT title, company, date_scraped FROM jobs ORDER BY date_scraped DESC LIMIT 5"
        ).fetchall()
    
    print(f"\n📊 Database Stats")
    print(f"   Total jobs: {total}")
    
    print("\n   By status:")
    for row in status_counts:
        print(f"     {row[0]}: {row[1]}")
    
    print("\n   By role:")
    for row in role_counts:
        print(f"     {row[0]}: {row[1]}")
    
    print("\n   Recent jobs:")
    for row in recent:
        print(f"     {row[1][:30]:30} | {row[2]}")


def update_job_status(job_id: str, status: str):
    """Update job status."""
    with get_db() as conn:
        conn.execute(
            "UPDATE jobs SET status = ? WHERE id = ?",
            (status, job_id)
        )
        conn.commit()
    print(f"✅ Updated {job_id} → {status}")


def search_jobs(query: str = None, status: str = None, role: str = None):
    """Search jobs."""
    with get_db() as conn:
        sql = "SELECT * FROM jobs WHERE 1=1"
        params = []
        
        if status:
            sql += " AND status = ?"
            params.append(status)
        
        if role:
            sql += " AND role_type = ?"
            params.append(role)
        
        if query:
            sql += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%", f"%{query}%"])
        
        sql += " ORDER BY date_scraped DESC LIMIT 20"
        
        rows = conn.execute(sql, params).fetchall()
    
    print(f"\n🔍 Found {len(rows)} jobs:\n")
    for row in rows:
        tags = json.loads(row["tags"]) if row["tags"] else []
        print(f"  [{row['status']:10}] {row['title'][:45]:45} @ {row['company'][:20]}")
        print(f"             Tags: {', '.join(tags[:5])}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Job search database")
    parser.add_argument("--init", action="store_true", help="Initialize database")
    parser.add_argument("--update", action="store_true", help="Import today's jobs")
    parser.add_argument("--import", dest="import_path", help="Import specific JSON file")
    parser.add_argument("--stats", action="store_true", help="Show statistics")
    parser.add_argument("--search", help="Search jobs")
    parser.add_argument("--status", help="Filter by status")
    parser.add_argument("--role", help="Filter by role type")
    parser.add_argument("--set-status", nargs=2, metavar=("JOB_ID", "STATUS"), help="Update job status")
    
    args = parser.parse_args()
    
    if args.init:
        init_db()
    elif args.update:
        import_from_json()
    elif args.import_path:
        import_from_json(Path(args.import_path))
    elif args.stats:
        get_stats()
    elif args.search or args.status or args.role:
        search_jobs(args.search, args.status, args.role)
    elif args.set_status:
        update_job_status(args.set_status[0], args.set_status[1])
    else:
        print("\n📁 Job Search Database")
        print(f"   Location: {DB_PATH}")
        print("\n   Commands:")
        print("     --init          Initialize database")
        print("     --update        Import all JSON files")
        print("     --stats         Show statistics")
        print("     --search TERM   Search jobs")
        print("     --status VALUE  Filter by status (new/applied/etc)")
        print("     --role TYPE     Filter by role type")


if __name__ == "__main__":
    main()
