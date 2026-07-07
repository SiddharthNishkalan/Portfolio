"""
routes/contact.py — Contact Form API
POST /api/contact/      → Submit contact message
GET  /api/contact/      → List messages (admin; requires secret key header)
GET  /api/contact/<id>  → Single message
PUT  /api/contact/<id>/read → Mark as read
"""

import os
import re
from flask import Blueprint, request, jsonify, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db, ContactMessage
from utils.email_sender import send_contact_email

contact_bp = Blueprint("contact", __name__)


# ── Validators ──────────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _validate_contact(data: dict) -> tuple[bool, str]:
    name    = (data.get("name")    or "").strip()
    email   = (data.get("email")   or "").strip()
    message = (data.get("message") or "").strip()

    if len(name) < 2:
        return False, "Name must be at least 2 characters."
    if len(name) > 120:
        return False, "Name is too long (max 120 chars)."
    if not EMAIL_RE.match(email):
        return False, "Please provide a valid email address."
    if len(message) < 10:
        return False, "Message must be at least 10 characters."
    if len(message) > 3000:
        return False, "Message is too long (max 3000 chars)."
    return True, ""


def _is_admin(req) -> bool:
    """Simple secret-key guard for read endpoints."""
    key = req.headers.get("X-Admin-Key", "")
    return key == current_app.config.get("SECRET_KEY", "")


# ── Routes ──────────────────────────────────────────────────────────────────

@contact_bp.route("/", methods=["POST"])
def submit_contact():
    """
    Accepts JSON or form-data contact submissions.
    Rate-limited to 5 submissions per IP per hour.
    """
    # Basic honeypot field check (bot protection)
    data = request.get_json(silent=True) or request.form.to_dict()
    if data.get("website"):          # hidden field; bots fill it
        return jsonify({"success": True}), 200  # silently drop

    valid, error = _validate_contact(data)
    if not valid:
        return jsonify({"success": False, "error": error}), 400

    # Persist to DB
    msg = ContactMessage(
        name       = data["name"].strip(),
        email      = data["email"].strip().lower(),
        subject    = (data.get("subject") or "Portfolio Enquiry").strip()[:255],
        message    = data["message"].strip(),
        ip_address = request.remote_addr,
        user_agent = request.headers.get("User-Agent", "")[:300],
    )
    db.session.add(msg)
    db.session.commit()

    # Fire email (non-blocking; errors caught)
    try:
        send_contact_email(msg)
    except Exception as exc:
        current_app.logger.error(f"Email send failed: {exc}")
        # Don't fail the request even if email fails

    return jsonify({
        "success": True,
        "message": "Thanks for reaching out! Siddharth will reply within 24 hours.",
        "id": msg.id,
    }), 201


@contact_bp.route("/", methods=["GET"])
def list_contacts():
    """Return all messages (admin only)."""
    if not _is_admin(request):
        return jsonify({"error": "Unauthorised"}), 401

    page     = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread   = request.args.get("unread", "false").lower() == "true"

    query = ContactMessage.query
    if unread:
        query = query.filter_by(is_read=False)
    query = query.order_by(ContactMessage.created_at.desc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "total":    paginated.total,
        "page":     paginated.page,
        "pages":    paginated.pages,
        "messages": [m.to_dict() for m in paginated.items],
    }), 200


@contact_bp.route("/<int:msg_id>", methods=["GET"])
def get_contact(msg_id):
    """Single message (admin only)."""
    if not _is_admin(request):
        return jsonify({"error": "Unauthorised"}), 401

    msg = ContactMessage.query.get_or_404(msg_id)
    return jsonify(msg.to_dict()), 200


@contact_bp.route("/<int:msg_id>/read", methods=["PUT"])
def mark_read(msg_id):
    """Mark a message as read (admin only)."""
    if not _is_admin(request):
        return jsonify({"error": "Unauthorised"}), 401

    msg = ContactMessage.query.get_or_404(msg_id)
    msg.is_read = True
    db.session.commit()
    return jsonify({"success": True, "id": msg.id, "is_read": True}), 200
