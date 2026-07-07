"""
models.py — Database Models
Tables: ContactMessage, PageVisit
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class ContactMessage(db.Model):
    """Stores every contact form submission."""
    __tablename__ = "contact_messages"

    id         = db.Column(db.Integer,  primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(200), nullable=False)
    subject    = db.Column(db.String(255), nullable=True,  default="Portfolio Contact")
    message    = db.Column(db.Text,        nullable=False)
    ip_address = db.Column(db.String(60),  nullable=True)
    user_agent = db.Column(db.String(300), nullable=True)
    is_read    = db.Column(db.Boolean,     default=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "subject":    self.subject,
            "message":    self.message,
            "is_read":    self.is_read,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<ContactMessage from={self.name} email={self.email}>"


class PageVisit(db.Model):
    """Tracks unique page visits (hashed IPs for privacy)."""
    __tablename__ = "page_visits"

    id         = db.Column(db.Integer, primary_key=True)
    ip_hash    = db.Column(db.String(64),  nullable=True)   # SHA-256 of IP
    page       = db.Column(db.String(100), default="/")
    referrer   = db.Column(db.String(300), nullable=True)
    user_agent = db.Column(db.String(300), nullable=True)
    visited_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "page":       self.page,
            "visited_at": self.visited_at.isoformat(),
        }

    def __repr__(self):
        return f"<PageVisit page={self.page} at={self.visited_at}>"
