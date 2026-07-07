"""
config.py — Application Configuration
Reads from .env file via python-dotenv
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Flask ──
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    DEBUG      = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    PORT       = int(os.getenv("PORT", 5000))

    # ── Database ──
    BASE_DIR         = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'database', 'portfolio.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Email (Gmail SMTP) ──
    MAIL_SERVER   = os.getenv("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT     = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")   # your gmail
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")   # app password
    MAIL_RECEIVER = os.getenv("MAIL_RECEIVER", "s.siddharthnishkalan@gmail.com")

    # ── GitHub ──
    GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "siddharthnishkalan")
    GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN", "")  # optional, avoids rate limits

    # ── CORS ──
    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500"
    ).split(",")


class ProductionConfig(Config):
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
