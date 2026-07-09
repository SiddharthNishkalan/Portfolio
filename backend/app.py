"""
app.py — Flask Backend for Siddharth Nishkalan Portfolio
Author : Siddharth Nishkalan S
Stack  : Python · Flask · SQLAlchemy · SQLite
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models import db
from routes.contact import contact_bp
from routes.stats import stats_bp
from routes.github_proxy import github_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Extensions ──
    db.init_app(app)
    CORS(
    app,
    resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "60 per hour"],
        storage_uri="memory://",
    )

    # ── Blueprints ──
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(stats_bp,   url_prefix="/api/stats")
    app.register_blueprint(github_bp,  url_prefix="/api/github")

    # ── Health check ──
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "version": "1.0.0"}), 200

    # ── 404 / 500 handlers ──
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(429)
    def too_many_requests(e):
        return jsonify({"error": "Too many requests, slow down!"}), 429

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    # ── Create tables ──
    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], port=app.config["PORT"])
