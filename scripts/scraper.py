#!/usr/bin/env python3
"""Job scraper - Fetches remote dev jobs from RSS feeds."""

import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET

# HTML cleaning for descriptions
def clean_html(text):
    """Strip HTML tags and decode entities."""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode common HTML entities
    text = (text
        .replace('&nbsp;', ' ')
        .replace('&amp;', '&')
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&quot;', '"')
        .replace('&#39;', "'")
        .replace('&rsquo;', "'")
        .replace('&lsquo;', "'")
        .replace('&rdquo;', '"')
        .replace('&ldquo;', '"')
        .replace('&ndash;', '-')
        .replace('&mdash;', '-')
        .replace('&hellip;', '...')
        .replace('&#8217;', "'")
        .replace('&#8220;', '"')
        .replace('&#8221;', '"')
        .replace('&#8211;', '-')
    )
    # Fix unicode escapes
    text = text.encode('latin1', 'ignore').decode('utf-8', 'ignore')
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "jobs"
MIN_SALARY = 50000

# Keywords matching user's stack/interests
TECH_KEYWORDS = {
    "vue": ["vue", "vue.js", "vuejs"],
    "nuxt": ["nuxt", "nuxt.js", "nuxtjs"],
    "react": ["react", "react.js", "reactjs"],
    "javascript": ["javascript", "js", "es6", "es2020"],
    "typescript": ["typescript", "ts", ".ts"],
    "frontend": ["frontend", "front-end", "front end", "ui developer", "web developer"],
    "fullstack": ["fullstack", "full-stack", "full stack"],
    "tailwind": ["tailwind", "tailwindcss"],
    "css": ["css", "scss", "sass", "styled-components"],
    "html": ["html", "html5"],
}

SUPPORT_KEYWORDS = ["support", "help desk", "helpdesk", "it support", "technical support"]
DATA_KEYWORDS = ["data entry", "data analyst", "data specialist"]

ALL_KEYWORDS = (
    [kw for group in TECH_KEYWORDS.values() for kw in group] 
    + SUPPORT_KEYWORDS 
    + DATA_KEYWORDS
)

# Exclude senior/management roles
EXCLUDE_TITLE = [
    "senior", "sr.", "sr ", "lead ", "principal", "staff ",
    "director", "manager", "head of", "vp", "vice president",
    "architect", "c-level", "executive", " iii", " iv", " v",
]

EXCLUDE_DESC = ["10+ years", "8+ years", "7+ years", "6+ years", "senior-level"]
DRUG_TEST_KWS = ["drug test", "drug screening", "urine test", "pre-employment drug"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x64) JobScraperBot/1.0 (Personal Project)",
}


def fetch_xml(url: str, timeout: int = 20) -> Optional[bytes]:
    """Fetch XML content with gzip handling."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                import gzip
                data = gzip.decompress(data)
            return data
    except Exception as e:
        print(f"    Error fetching {url}: {e}")
        return None


def parse_rss(content: bytes) -> list:
    """Parse RSS 2.0 and Atom feeds."""
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        print(f"    Parse error: {e}")
        return []
    
    entries = []
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    
    # RSS 2.0
    channel = root.find("channel")
    if channel is not None:
        for item in channel.findall("item"):
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            if not link:
                link = item.findtext("guid", "").strip()
            desc = item.findtext("description", "").strip()
            date = item.findtext("pubDate", "")
            company = item.findtext("{http://remoteok.com/rss}company", "")
            
            if title and link:
                entries.append({
                    "title": title, "link": link, "description": desc,
                    "date_posted": date, "company": company,
                })
        return entries
    
    # Atom
    for entry in root.findall("atom:entry", ns):
        title = entry.findtext("atom:title", "", ns).strip()
        link_elem = entry.find("atom:link", ns)
        link = link_elem.get("href", "") if link_elem else ""
        desc = entry.findtext("atom:summary", "", ns).strip() or entry.findtext("atom:content", "", ns).strip()
        date = entry.findtext("atom:published", "", ns)
        
        if title and link:
            entries.append({
                "title": title, "link": link, "description": desc,
                "date_posted": date, "company": "",
            })
    
    return entries


def generate_id(source: str, url: str) -> str:
    """Generate unique job ID."""
    hash_input = f"{source}:{url}".encode("utf-8")
    short_hash = hashlib.sha256(hash_input).hexdigest()[:12]
    return f"{source.lower()}-{short_hash}"


def is_senior_role(title: str, desc: str) -> bool:
    """Filter out senior/management roles."""
    combined = f"{title} {desc}".lower()
    title_lower = title.lower()
    return any(kw in title_lower for kw in EXCLUDE_TITLE) or any(kw in combined for kw in EXCLUDE_DESC)


def has_drug_test(text: str) -> bool:
    """Check for drug test requirements."""
    return any(kw in text.lower() for kw in DRUG_TEST_KWS)


def extract_salary(text: str) -> tuple:
    """Extract salary range from text. Returns (min, max, raw_text)."""
    if not text:
        return None, None, None
    
    text = text.lower()
    salaries = []
    
    # Match ranges like "60k-80k" or "$60,000 - $80,000"
    patterns = [
        r'(\d{2,3})\s*k\s*(?:-|to|–)\s*(\d{2,3})\s*k',  # 60k-80k
        r'(?:\$)?(\d{2,3})k?\s*(?:-|to)\s*(?:\$)?(\d{2,3})k?',  # $60,000-$80,000
        r'up to [\$]?(\d{2,3})k?',  # Up to $80k
        r'start(?:ing)? at [\$]?(\d{2,3})k?',  # Starting at $60k
    ]
    
    for pattern in patterns:
        for m in re.finditer(pattern, text):
            for group in m.groups():
                if group:
                    val = int(group) * 1000 if len(group) <= 3 else int(group.replace(',', ''))
                    if val >= 30000:
                        salaries.append(val)
    
    if len(salaries) >= 2:
        return min(salaries), max(salaries), m.group(0) if 'm' in dir() else None
    elif salaries:
        return salaries[0], None, None
    
    return None, None, None


def detect_experience_level(title: str, desc: str) -> str:
    """Detect experience level from text."""
    combined = f"{title} {desc}".lower()
    
    if any(kw in combined for kw in ["entry-level", "entry level", "0-2 years", "0 to 2", "new grad", "recent grad"]):
        return "entry"
    if any(kw in combined for kw in ["junior", "jr", "1-3 years", "1 to 3", "2-4 years"]):
        return "junior"
    if any(kw in combined for kw in ["mid-level", "mid level", "3-5 years", "4-6 years"]):
        return "mid"
    if any(kw in combined for kw in ["senior", "sr.", "5+ years", "6+ years"]):
        return "senior"
    
    return "any"


def detect_role_type(text: str) -> str:
    """Categorize role type."""
    text = text.lower()
    
    if any(kw in text for kw in ["frontend", "front-end", "ui/ux", "ui developer", "client-side"]):
        return "frontend"
    if any(kw in text for kw in ["backend", "back-end", "server-side", "api", "database"]):
        return "backend"
    if "fullstack" in text or "full-stack" in text or "full stack" in text:
        return "fullstack"
    if any(kw in text for kw in ["mobile", "ios", "android", "react native", "flutter"]):
        return "mobile"
    if any(kw in text for kw in ["devops", "sre", "infrastructure", "platform"]):
        return "devops"
    if any(kw in text for kw in ["support", "helpdesk", "help desk"]):
        return "support"
    if any(kw in text for kw in ["qa", "test", "quality assurance"]):
        return "qa"
    if any(kw in text for kw in ["data analyst", "data scientist", "data engineer"]):
        return "data"
    
    return "other"


def check_location(desc: str) -> tuple:
    """Check location type. Returns (location_str, is_remote)."""
    desc_lower = desc.lower()
    
    if any(kw in desc_lower for kw in ["remote", "work from home", "wfh", "anywhere"]):
        return ("Remote", True)
    if "hybrid" in desc_lower:
        return ("Hybrid", False)
    if "usa" in desc_lower or "united states" in desc_lower:
        return ("USA (unspecified)", False)
    
    # Try to extract city, state
    match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*[A-Z]{2}\b', desc)
    if match:
        return (match.group(0), False)
    
    return ("Location TBD", False)


def load_existing_jobs(data_dir: Path) -> set:
    """Load all existing job URLs to avoid duplicates."""
    existing_urls = set()
    for year_month_dir in data_dir.iterdir():
        if not year_month_dir.is_dir():
            continue
        for json_file in year_month_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    jobs = json.load(f)
                    for job in jobs:
                        if isinstance(job, dict) and "url" in job:
                            existing_urls.add(job["url"])
                            # Also normalize URL variants
                            url = job["url"].split("?")[0].rstrip("/")
                            existing_urls.add(url)
            except (json.JSONDecodeError, IOError):
                continue
    return existing_urls


def find_tags(title: str, desc: str) -> list:
    """Find matching tech tags."""
    combined = f"{title} {desc}".lower()
    tags = []
    
    for tag, keywords in TECH_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            tags.append(tag)
    
    if any(kw in combined for kw in SUPPORT_KEYWORDS):
        tags.append("support")
    
    if "remote" in combined:
        tags.append("remote")
    
    return sorted(tags)


def normalize_url(url: str) -> str:
    """Normalize URL for deduplication comparison."""
    # Remove query params and trailing slashes
    url = url.split("?")[0].rstrip("/")
    # Remove hash
    url = url.split("#")[0]
    # Lowercase for comparison
    return url.lower()


def matches_criteria(entry: dict) -> bool:
    """Main filter function for user's needs."""
    title = entry.get("title", "")
    desc = entry.get("description", "")
    full = f"{title} {desc}".lower()
    
    # Exclude drug tests
    if has_drug_test(full):
        return False
    
    # Exclude senior roles
    if is_senior_role(title, desc):
        return False
    
    # Must have some tech keywords
    if not any(kw in full for kw in ALL_KEYWORDS):
        return False
    
    # Check salary if mentioned
    salary_min, _, _ = extract_salary(full)
    if salary_min and salary_min < MIN_SALARY:
        return False
    
    # Must have dev-related title
    dev_pattern = r'(developer|engineer|programmer|support|help.?desk|analyst)'
    if not re.search(dev_pattern, title, re.I):
        return False
    
    return True


def extract_company_from_description(desc: str) -> str:
    """Extract company name from description patterns like 'here at [company]' or 'with [company]'."""
    if not desc:
        return ""
    
    desc_lower = desc.lower()
    
    # Patterns to match company names
    patterns = [
        # "here at [company]" / "join us at [company]"
        r'(?:here|join us|work|team)\s+(?:at|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,.!]|\s+(?:we|you|and|our|as|where|to|we\'re|$))',
        # "with [company]" when talking about working there
        r'(?:work|job|role|position|opportunity)\s+(?:with|at)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,.!]|\s+(?:we|you|and|our|as|where|to|we\'re|$))',
        # "About [company]"
        r'about\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,:]|\s+(?:we|our|the|\$|\d))',
        # "[company] is looking for"
        r'([A-Z][A-Za-z0-9\s&]+?)\s+is\s+(?:looking|hiring|seeking)',
        # "Welcome to [company]"
        r'welcome\s+(?:to\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:\s*[.!]|\s+(?:we|where|our|$))',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, desc, re.IGNORECASE)
        if match:
            company = match.group(1).strip()
            # Clean up common noise words
            company = re.sub(r'\s+(?:Inc|LLC|Ltd|Limited|Corp|Corporation|Company)\.?$', '', company, flags=re.IGNORECASE)
            # Make sure it's not too short or generic
            if len(company) > 2 and company.lower() not in ['the', 'our', 'this', 'your', 'we', 'and']:
                return company
    
    return ""


def format_job(entry: dict, source: str) -> dict:
    """Convert entry to standardized Job schema."""
    title = entry.get("title", "")
    desc = entry.get("description", "")
    url = entry.get("link", "")
    
    location, is_remote = check_location(desc)
    salary_min, salary_max, salary_text = extract_salary(f"{title} {desc}")
    tags = find_tags(title, desc)
    exp_level = detect_experience_level(title, desc)
    role_type = detect_role_type(f"{title} {desc}")
    
    # Extract company
    company = entry.get("company", "")
    if not company and ":" in title:
        company = title.split(":")[0].strip()
    if not company:
        # Try to extract from description
        company = extract_company_from_description(desc)
    if not company and source == "RemoteOK":
        # Try RemoteOK URL pattern: remoteok.com/remote-jobs/remote-[job]-[company]-[id]
        url_match = re.search(r'remoteok\.com.*-job[s]?/.*-([^-]+(?:-[^-]+){0,2})-\d+$', url)
        if url_match:
            company = url_match.group(1).replace('-', ' ').title()
    
    job_id = generate_id(source, url)
    
    return {
        "id": job_id,
        "title": re.sub(r'^[^:]+?:\s*', '', title).strip(),  # Remove company prefix
        "company": company or "Unknown",
        "location": location,
        "is_remote": is_remote,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_text": salary_text,
        "description": clean_html(desc[:3000]),  # Clean HTML, limit size
        "description_short": clean_html(desc[:500]),  # Clean HTML, limit size
        "url": url,
        "source": source,
        "source_id": None,
        "date_posted": entry.get("date_posted", ""),
        "date_scraped": datetime.now().strftime("%Y-%m-%d"),
        "tags": tags,
        "required_skills": [],  # To be filled manually
        "experience_level": exp_level,
        "role_type": role_type,
        "employment_type": "full-time",  # Default
        "flags": {
            "has_drug_test": False,
            "is_senior": False,
            "is_hidden": False,
            "is_duplicate": False,
            "match_score": 0,  # To be calculated
        },
        "status": "new",
        "application_id": None,
    }


def get_sources() -> list:
    """Job feed sources."""
    return [
        {"name": "RemoteOK", "url": "https://remoteok.com/rss"},
        {"name": "WeWorkRemotely", "url": "https://weworkremotely.com/remote-jobs.rss"},
        {"name": "WWR-Programming", "url": "https://weworkremotely.com/categories/remote-programming-jobs.rss"},
        {"name": "JS-Remotely", "url": "https://jsremotely.com/rss.xml"},
        {"name": "Remotive", "url": "https://remotive.com/api/remote-jobs"},
    ]


def save_jobs(jobs: list, date: datetime = None) -> Path:
    """Save jobs to dated JSON file."""
    date = date or datetime.now()
    month_dir = DATA_DIR / date.strftime("%Y-%m")
    month_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = month_dir / f"{date.strftime('%Y-%m-%d')}.json"
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    return filepath


def main():
    print("=" * 60)
    print("JOB SEARCH SCRAPER")
    print("=" * 60)
    print()
    
    # Load existing jobs for deduplication
    print("Loading existing jobs...")
    existing_urls = load_existing_jobs(DATA_DIR)
    print(f"  {len(existing_urls)} existing URLs loaded")
    print()
    
    today = datetime.now()
    
    sources = get_sources()
    print(f"Checking {len(sources)} sources...\n")
    
    all_jobs = []
    seen_urls = set()
    
    for src in sources:
        print(f"  → {src['name']}", end=" ", flush=True)
        
        content = fetch_xml(src["url"])
        if not content:
            print("❌ fetch failed")
            continue
        
        entries = parse_rss(content)
        if not entries:
            print("⚠️ no entries")
            continue
        
        found = 0
        for entry in entries[:50]:  # Limit per source
            if matches_criteria(entry):
                job = format_job(entry, src["name"])
                
                # Check against existing URLs (both raw and normalized)
                normalized_url = normalize_url(job["url"])
                if job["url"] not in seen_urls and normalized_url not in existing_urls:
                    seen_urls.add(job["url"])
                    all_jobs.append(job)
                    found += 1
        
        print(f"✓ {found} matches")
    
    print()
    print(f"{'=' * 60}")
    print(f"TOTAL: {len(all_jobs)} jobs found")
    print(f"{'=' * 60}")
    
    if all_jobs:
        filepath = save_jobs(all_jobs, today)
        print(f"\n✅ Saved to: {filepath}")
        
        # Print summary by role type
        by_role = {}
        for job in all_jobs:
            rt = job["role_type"]
            by_role[rt] = by_role.get(rt, 0) + 1
        
        print("\nBy role type:")
        for role, count in sorted(by_role.items()):
            print(f"  {role}: {count}")
        
        # Show first 5
        print("\nTop matches:")
        for i, job in enumerate(all_jobs[:5], 1):
            print(f"  {i}. {job['title'][:55]} @ {job['company']}")
    
    else:
        print("\n⚠️ No matching jobs found today")
        # Create empty file for tracking
        filepath = save_jobs([], today)
        print(f"  Created empty file: {filepath}")
    
    print()
    return len(all_jobs)


if __name__ == "__main__":
    sys.exit(main())
