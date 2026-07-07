"""
routes/github_proxy.py — GitHub API Proxy
GET /api/github/profile  → User profile stats
GET /api/github/repos    → Public repos list
GET /api/github/pinned   → Pinned/featured repos (hardcoded + live)

Caches results for 10 minutes to avoid rate limits.
"""

import time
import requests
from flask import Blueprint, jsonify, current_app

github_bp = Blueprint("github", __name__)

# ── Simple in-memory cache ────────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 600  # 10 minutes

def _cached(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None

def _set_cache(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


def _gh_headers() -> dict:
    token = current_app.config.get("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _gh_get(url: str) -> tuple[dict | list | None, int]:
    try:
        r = requests.get(url, headers=_gh_headers(), timeout=8)
        if r.status_code == 200:
            return r.json(), 200
        return None, r.status_code
    except requests.RequestException as e:
        current_app.logger.error(f"GitHub request failed: {e}")
        return None, 503


# ── Routes ───────────────────────────────────────────────────────────────────

@github_bp.route("/profile", methods=["GET"])
def gh_profile():
    """Return GitHub user stats."""
    username = current_app.config["GITHUB_USERNAME"]
    key = f"profile:{username}"

    cached = _cached(key)
    if cached:
        return jsonify(cached), 200

    data, status = _gh_get(f"https://api.github.com/users/{username}")
    if not data:
        return jsonify({"error": "GitHub unavailable"}), status

    result = {
        "username":    data.get("login"),
        "name":        data.get("name"),
        "bio":         data.get("bio"),
        "avatar_url":  data.get("avatar_url"),
        "public_repos":data.get("public_repos", 0),
        "followers":   data.get("followers", 0),
        "following":   data.get("following", 0),
        "html_url":    data.get("html_url"),
        "location":    data.get("location"),
    }
    _set_cache(key, result)
    return jsonify(result), 200


@github_bp.route("/repos", methods=["GET"])
def gh_repos():
    """Return list of public repos sorted by stars."""
    username = current_app.config["GITHUB_USERNAME"]
    key = f"repos:{username}"

    cached = _cached(key)
    if cached:
        return jsonify(cached), 200

    data, status = _gh_get(
        f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30"
    )
    if not data:
        return jsonify({"error": "GitHub unavailable"}), status

    repos = []
    for repo in data:
        if repo.get("fork"):
            continue  # skip forks
        repos.append({
            "name":        repo["name"],
            "description": repo.get("description"),
            "html_url":    repo["html_url"],
            "language":    repo.get("language"),
            "stars":       repo.get("stargazers_count", 0),
            "forks":       repo.get("forks_count", 0),
            "updated_at":  repo.get("updated_at"),
            "topics":      repo.get("topics", []),
        })

    # Sort by stars desc
    repos.sort(key=lambda r: r["stars"], reverse=True)

    _set_cache(key, repos)
    return jsonify(repos), 200


@github_bp.route("/pinned", methods=["GET"])
def gh_pinned():
    """
    Returns featured projects (manually curated to match resume)
    merged with live GitHub data.
    """
    username = current_app.config["GITHUB_USERNAME"]
    featured_names = ["Air-Canva", "Interview-Guard", "air-canva", "interview-guard"]

    # Fetch all repos
    all_repos, status = _gh_get(
        f"https://api.github.com/users/{username}/repos?per_page=100"
    )
    if not all_repos:
        # Return static fallback
        return jsonify([
            {
                "name": "Air-Canva",
                "description": "Hand gesture drawing application using Python, OpenCV, MediaPipe, NumPy.",
                "html_url": f"https://github.com/{username}/Air-Canva",
                "language": "Python",
                "stars": 0, "forks": 0,
            },
            {
                "name": "Interview-Guard",
                "description": "Online recruitment integrity platform — detecting proxy interviews.",
                "html_url": f"https://github.com/{username}/Interview-Guard",
                "language": "Python",
                "stars": 0, "forks": 0,
            },
        ]), 200

    # Filter featured
    pinned = [
        {
            "name":        r["name"],
            "description": r.get("description"),
            "html_url":    r["html_url"],
            "language":    r.get("language"),
            "stars":       r.get("stargazers_count", 0),
            "forks":       r.get("forks_count", 0),
            "updated_at":  r.get("updated_at"),
            "topics":      r.get("topics", []),
        }
        for r in all_repos
        if r["name"].lower() in [n.lower() for n in featured_names]
    ]

    return jsonify(pinned), 200
