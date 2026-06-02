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
    
    # Decode HTML entities FIRST (before tag stripping can mangle them)
    text = (text
        .replace('&nbsp;', ' ')
        .replace('&amp;', '&')
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&quot;', '"')
        .replace('&#39;', "'")
        .replace('&#034;', '"')
        .replace('&rsquo;', "'")
        .replace('&lsquo;', "'")
        .replace('&rdquo;', '"')
        .replace('&ldquo;', '"')
        .replace('&ndash;', '-')
        .replace('&mdash;', '-')
        .replace('&hellip;', '...')
        .replace('&#8217;', "'")
        .replace('&#8216;', "'")
        .replace('&#8220;', '"')
        .replace('&#8221;', '"')
        .replace('&#8211;', '-')
        .replace('&#8203;', '')  # zero-width space
        .replace('&#8239;', ' ')  # narrow non-breaking space
        .replace('&#8195;', ' ')  # em space
        .replace('&#8194;', ' ')  # en space
        .replace('&#xa0;', ' ')   # non-breaking space
    )
    
    # Remove HTML tags AFTER entity decoding (so < becomes actual < char)
    text = re.sub(r'<[^>]*?>', ' ', text, flags=re.DOTALL)
    
    # Remove inline CSS style attributes (e.g., style="...")
    text = re.sub(r'style="[^"]*"', '', text)
    
    # Remove other style-like fragments that escaped
    text = re.sub(r'\s*style\s*=\s*"[^"]*"', '', text)
    text = re.sub(r'\s*dir\s*=\s*"[^"]*"', '', text)
    
    # Fix unicode escapes
    try:
        text = text.encode('latin1', 'ignore').decode('utf-8', 'ignore')
    except:
        pass
    
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "jobs"
MIN_SALARY = 50000


def fetch_json(url: str, timeout: int = 20) -> Optional[dict]:
    """Fetch JSON from API."""
    try:
        req = urllib.request.Request(url, headers={
            **HEADERS,
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read().decode("utf-8")
            return json.loads(data)
    except Exception as e:
        print(f"    Error fetching JSON {url}: {e}")
        return None


def parse_remotive_api(data: dict) -> list:
    """Parse Remotive JSON API response."""
    entries = []
    jobs = data.get("jobs", [])
    for job in jobs:
        title = job.get("title", "").strip()
        url = job.get("url", "").strip()
        desc = job.get("description", "").strip()
        date = job.get("publication_date", "")
        company = job.get("company_name", "")
        
        if title and url:
            # Check location - only include remote or USA-based
            location = job.get("candidate_required_location", "")
            location_str = str(location) if location else ""
            
            entries.append({
                "title": title,
                "link": url,
                "description": desc,
                "date_posted": date,
                "company": company,
                "location": location_str,
            })
    return entries

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


def parse_html_jobs(content: bytes, source: str) -> list:
    """Parse HTML job listings (e.g., Hacker News)."""
    text = content.decode("utf-8", errors="ignore")
    entries = []
    
    if source == "HN-Jobs":
        # HN jobs is a simple table with titleline links
        # Pattern: <span class="titleline"><a href="URL">TITLE</a></span>
        pattern = r'<span class="titleline">\s*<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>'
        for match in re.finditer(pattern, text):
            link = match.group(1)
            title_html = match.group(2)
            # Clean title (remove nested HTML)
            title = re.sub(r'<[^>]+>', '', title_html)
            title = title.strip()
            
            if title and link:
                # Make absolute URL
                if link.startswith('/'):
                    link = 'https://news.ycombinator.com' + link
                elif not link.startswith('http'):
                    link = 'https://' + link
                    
                entries.append({
                    "title": title,
                    "link": link,
                    "description": f"{source} job listing",
                    "date_posted": "",
                    "company": "",
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
    
    # Remote detection
    if any(kw in desc_lower for kw in ["remote", "work from home", "wfh", "anywhere"]):
        return ("Remote", True)
    
    # Hybrid detection
    if "hybrid" in desc_lower:
        return ("Hybrid", False)
    
    # Oklahoma detection (city, state or state name)
    ok_patterns = [
        r'\boklahoma\s*(?:city)?\b',
        r'(tulsa|norman|edmond|stillwater|broken arrow|moore|lawton),?\s*ok\b',
        r',\s*ok\s*\d{5}',
    ]
    for pattern in ok_patterns:
        match = re.search(pattern, desc_lower)
        if match:
            return ("Oklahoma (" + match.group(0).replace(',', '').strip().title() + ")", False)
    
    # Generic USA references
    if re.search(r'\busa\b|\bunited states\b', desc_lower):
        return ("USA (unspecified)", False)
    
    # Try to extract city, state
    match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*[A-Z]{2}\b', desc)
    if match:
        return (match.group(0), False)
    
    # If no clear location, mark as Location TBD (will be filtered out by matches_criteria)
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
    
    # Exclude premium/paywall jobs (RemoteOK pattern)
    if re.search(r'upgrade.*?premium|premium.*?member|subscribe.*?view|log\s*in\s+to\s+view|sign\s*in\s+to\s+view', full, re.IGNORECASE):
        return False
    
    # Exclude RemoteOK truncated jobs (super short descriptions = paywalled)
    if "remoteok" in entry.get("link", "").lower() and len(str(desc)) < 1000:
        return False
    
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
    
    # Check location - only save Remote or Oklahoma jobs
    location, is_remote = check_location(desc)
    is_oklahoma = bool(re.search(r'\boklahoma\b|\bok\b', f"{location} {desc}".lower()))
    if not is_remote and not is_oklahoma:
        return False
    
    # Must have dev-related title
    dev_pattern = r'(developer|engineer|programmer|support|help.?desk|analyst)'
    if not re.search(dev_pattern, title, re.I):
        return False
    
    return True


# Known company slugs for common sites
KNOWN_COMPANIES = {
    'sticker-mule': 'Sticker Mule',
    'avalere-health': 'Avalere Health',
    'judi-health': 'Judi Health',
    'catamaran-research': 'Catamaran Research',
    'orc-id': 'ORCID',
    'crisp': 'Crisp',
    'far-out-scout': 'Far Out Scout',
    'ci-t': 'CI&T',
    'linear': 'Linear',
    'altarum': 'Altarum',
    'careers-in-travel': 'Careers in Travel',
}


def extract_company_from_description(desc: str) -> str:
    """Extract company name from description by counting frequency of potential matches."""
    if not desc:
        return ""
    
    BLOCKLIST = {
        'this', 'our', 'the', 'we', 'you', 'your', 'us', 'and', 'or',
        'this opportunity', 'our team', 'our company', 'the role',
        'the company', 'we believe', 'we are', 'your next',
        'the intersection', 'product managers', 'product team',
        'our mission', 'our values', 'our product', 'our platform',
        'the future', 'the world', 'your role', 'your work',
        'here', 'here we', 'at the', 'with the', 'about this',
        'about us', 'about our', 'about the', 'join us',
        'work with', 'work at', 'help us', 'helping us',
        'on our', 'on this', 'to our', 'to the', 'role', 'career',
        'opportunity', 'the role as', 'the opportunity we',
        'we are looking', 'you will', 'you can', 'remote',
    }
    
    candidates = []
    
    patterns = [
        r'([A-Z][A-Za-z0-9\s&]+?)\s+is\s+(?:hiring|seeking|looking)',
        r'(?:join|careers?\s+at)\s+(?:the\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:\s+team|\s*[,.]|\s+and)',
        r'(?:here|work)\s+at\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,.]|\s+we\s+)',
        r'welcome\s+(?:to\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,.]|\s+where)',
        r'about\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[:,.]|\s+we\s)',  
        r'\bat\s+([A-Z][A-Za-z0-9\s&]+?)\s*[,.\u00A0]',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, desc, re.IGNORECASE)
        for match in matches:
            company = match.group(1).strip()
            company = re.sub(r'\s+(?:Inc\.?|LLC\.?|Ltd\.?|Limited|Corp\.?|Corporation|Company)\.?$', '', company, flags=re.IGNORECASE)
            company = re.sub(r'\s+', ' ', company).strip()
            
            if len(company) < 3 or len(company) > 40:
                continue
            if company.lower() in BLOCKLIST:
                continue
            
            candidates.append(company)
    
    if not candidates:
        return ""
    
    # Count frequency - real company names appear multiple times
    from collections import Counter
    freq = Counter(candidates)
    most_common = freq.most_common()
    
    if most_common[0][1] > 1:
        return most_common[0][0]
    
    # Single appearance - validate it looks like a company name
    best = most_common[0][0]
    first_word = best.split()[0].lower() if best.split() else ""
    if first_word in ['the', 'our', 'this', 'we', 'us', 'your', 'a', 'an']:
        return ""
    
    return best


def extract_company_from_url(url: str, source: str) -> str:
    """Extract company name from URL patterns like RemoteOK and WeWorkRemotely."""
    if not url:
        return ""
    
    from urllib.parse import urlparse
    path = urlparse(url).path
    
    # Check KNOWN_COMPANIES first
    for slug, name in KNOWN_COMPANIES.items():
        if slug.replace('-', '') in path.lower().replace('-', '').replace('/', ''):
            return name
    
    # RemoteOK: try to extract from path
    match = re.search(r'remoteok.*-[^-]+(?:-[^-]+){1,4}-(\d+)$', path)
    if match:
        before_id = path[:path.rfind(match.group(1))].rstrip('-/')
        parts = before_id.split('/')[-1].replace('remote-', '').split('-')
        for i in range(min(4, len(parts))):
            potential = ' '.join(parts[max(0, len(parts)-3-i):]).title()
            if len(potential) >= 4:
                return potential
    
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
        # Try URL extraction first (more reliable)
        company = extract_company_from_url(url, source)
    if not company:
        # Fallback to description extraction
        company = extract_company_from_description(desc)
    
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
        {"name": "RemoteOK", "url": "https://remoteok.com/rss", "type": "rss"},
        {"name": "Remotive", "url": "https://remotive.com/api/remote-jobs", "type": "json"},
        {"name": "Jobspresso", "url": "https://jobspresso.co/?s&feed=rss2", "type": "rss"},
    ]


def save_jobs(jobs: list, date: datetime = None) -> tuple[Path, int]:
    """Save jobs to dated JSON file - APPENDS to existing, never overwrites."""
    date = date or datetime.now()
    month_dir = DATA_DIR / date.strftime("%Y-%m")
    month_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = month_dir / f"{date.strftime('%Y-%m-%d')}.json"
    
    # Load existing jobs if file exists
    existing_jobs = []
    existing_ids = set()
    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                existing_jobs = json.load(f)
                if isinstance(existing_jobs, list):
                    existing_ids = {j.get("id") for j in existing_jobs if isinstance(j, dict)}
                    print(f"  Found {len(existing_jobs)} existing jobs in {filepath.name}")
        except (json.JSONDecodeError, IOError) as e:
            print(f"  Warning: Could not read existing file: {e}")
    
    # Merge: add only new jobs (by ID)
    new_count = 0
    for job in jobs:
        if isinstance(job, dict) and job.get("id") not in existing_ids:
            existing_jobs.append(job)
            existing_ids.add(job.get("id"))
            new_count += 1
    
    # Write merged result
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(existing_jobs, f, indent=2, ensure_ascii=False)
    
    return filepath, new_count


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
        
        source_type = src.get("type", "rss")
        entries = []
        
        if source_type == "json":
            # JSON API (e.g., Remotive)
            data = fetch_json(src["url"])
            if data:
                entries = parse_remotive_api(data)
        elif source_type == "html":
            # HTML scraping (e.g., Hacker News)
            content = fetch_xml(src["url"])
            if content:
                entries = parse_html_jobs(content, src["name"])
        else:
            # RSS/Atom feed
            content = fetch_xml(src["url"])
            if content:
                entries = parse_rss(content)
        
        if not entries:
            print("❌ no entries")
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
        filepath, new_count = save_jobs(all_jobs, today)
        total_jobs = len(all_jobs)
        print(f"\n✅ Saved to: {filepath} ({new_count} new, {total_jobs - new_count} existing)")
        
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
        # Still check/create empty file (doesn't overwrite with data)
        filepath, _ = save_jobs([], today)
        print(f"  Ensured file exists: {filepath}")
    
    print()
    return len(all_jobs)


if __name__ == "__main__":
    sys.exit(main())
