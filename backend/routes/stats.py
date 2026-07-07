"""
routes/stats.py — Portfolio Statistics API
POST /api/stats/visit       → Record a page visit
GET  /api/stats/            → Public aggregate stats
GET  /api/stats/admin       → Full stats (admin only)
"""

import hashlib
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
from models import db, PageVisit, ContactMessage

stats_bp = Blueprint("stats", __name__)


def _hash_ip(ip: str) -> str:
    """One-way hash the IP address for privacy compliance."""
    return hashlib.sha256(ip.encode()).hexdigest()


def _is_admin(req) -> bool:
    key = req.headers.get("X-Admin-Key", "")
    return key == current_app.config.get("SECRET_KEY", "")


# ── Public: record a visit ───────────────────────────────────────────────────

@stats_bp.route("/visit", methods=["POST"])
def record_visit():
    """
    Called by frontend when a user loads the page.
    Stores hashed IP, page, referrer.
    """
    data = request.get_json(silent=True) or {}

    visit = PageVisit(
        ip_hash    = _hash_ip(request.remote_addr or "unknown"),
        page       = (data.get("page") or "/")[:100],
        referrer   = (request.referrer or data.get("referrer") or "")[:300],
        user_agent = request.headers.get("User-Agent", "")[:300],
    )
    db.session.add(visit)
    db.session.commit()

    return jsonify({"success": True}), 201


# ── Public: aggregate stats ──────────────────────────────────────────────────

@stats_bp.route("/", methods=["GET"])
def public_stats():
    """
    Returns non-sensitive stats shown on the frontend
    (total visitors, messages received).
    """
    total_visits   = PageVisit.query.count()
    total_contacts = ContactMessage.query.count()

    # Unique visitors (by ip_hash, last 30 days)
    since = datetime.utcnow() - timedelta(days=30)
    unique_30d = (
        db.session.query(func.count(func.distinct(PageVisit.ip_hash)))
        .filter(PageVisit.visited_at >= since)
        .scalar()
    )

    return jsonify({
        "total_visits":     total_visits,
        "unique_30d":       unique_30d,
        "total_contacts":   total_contacts,
    }), 200


# ── Admin: full stats dashboard ──────────────────────────────────────────────

@stats_bp.route("/admin", methods=["GET"])
def admin_stats():
    """Detailed stats (admin-only)."""
    if not _is_admin(request):
        return jsonify({"error": "Unauthorised"}), 401

    # Visits per day last 14 days
    since = datetime.utcnow() - timedelta(days=14)
    daily = (
        db.session.query(
            func.date(PageVisit.visited_at).label("day"),
            func.count().label("visits"),
        )
        .filter(PageVisit.visited_at >= since)
        .group_by(func.date(PageVisit.visited_at))
        .order_by(func.date(PageVisit.visited_at))
        .all()
    )

    # Top referrers
    referrers = (
        db.session.query(
            PageVisit.referrer,
            func.count().label("count"),
        )
        .filter(PageVisit.referrer != "", PageVisit.referrer.isnot(None))
        .group_by(PageVisit.referrer)
        .order_by(func.count().desc())
        .limit(10)
        .all()
    )

    # Unread messages
    unread = ContactMessage.query.filter_by(is_read=False).count()

    return jsonify({
        "total_visits":   PageVisit.query.count(),
        "total_contacts": ContactMessage.query.count(),
        "unread_messages": unread,
        "daily_visits": [{"day": r.day, "visits": r.visits} for r in daily],
        "top_referrers": [{"referrer": r.referrer, "count": r.count} for r in referrers],
    }), 200
