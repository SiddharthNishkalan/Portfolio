# 🚀 Siddharth Nishkalan — Portfolio Backend

Flask-based REST API powering the portfolio contact form, visitor analytics, and GitHub stats.

---

## 📁 Project Structure

```
backend/
├── app.py                  ← Flask app factory & entry point
├── config.py               ← Config (reads from .env)
├── models.py               ← SQLAlchemy models (ContactMessage, PageVisit)
├── routes/
│   ├── contact.py          ← POST/GET /api/contact/
│   ├── stats.py            ← GET /api/stats/
│   └── github_proxy.py     ← GET /api/github/profile|repos|pinned
├── utils/
│   └── email_sender.py     ← SMTP email via Gmail
├── database/               ← Auto-created; holds portfolio.db
├── requirements.txt
├── .env.example            ← Copy → .env and fill in values
└── README.md
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your Gmail credentials and secret key
```

### 3. Run development server

```bash
python app.py
# → http://localhost:5000
```

### 4. Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Submit contact form
curl -X POST http://localhost:5000/api/contact/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Hello Siddharth!"}'

# Get stats
curl http://localhost:5000/api/stats/

# GitHub profile
curl http://localhost:5000/api/github/profile
```

---

## 📡 API Reference

### Contact

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/contact/`             | Submit contact form      |
| GET    | `/api/contact/`             | List messages *(admin)*  |
| GET    | `/api/contact/<id>`         | Single message *(admin)* |
| PUT    | `/api/contact/<id>/read`    | Mark as read *(admin)*   |

**POST body:**
```json
{
  "name":    "Your Name",
  "email":   "you@example.com",
  "subject": "Internship Inquiry",
  "message": "Hi Siddharth, ..."
}
```

**Admin requests** require header: `X-Admin-Key: <your SECRET_KEY>`

---

### Stats

| Method | Endpoint           | Description                   |
|--------|--------------------|-------------------------------|
| POST   | `/api/stats/visit` | Record a page visit           |
| GET    | `/api/stats/`      | Public aggregate stats        |
| GET    | `/api/stats/admin` | Full dashboard *(admin)*      |

---

### GitHub

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/api/github/profile`     | User profile stats       |
| GET    | `/api/github/repos`       | All public repos         |
| GET    | `/api/github/pinned`      | Featured repos           |

Results cached for **10 minutes**.

---

## 📧 Email Setup (Gmail)

1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an App Password (select *Mail* + *Other*)
4. Paste the 16-character password into `MAIL_PASSWORD` in `.env`

> Siddharth receives an HTML notification email.  
> The sender receives a styled auto-reply confirming receipt.

---

## 🌐 Connecting Frontend

In `frontend/js/api.js`, update:

```js
const API_BASE = 'https://portfolio-backend-j18h.onrender.com'; // dev
// const API_BASE = 'https://your-deployed-api.com'; // prod
```

---

## 🚀 Deployment (Render / Railway / Heroku)

```bash
# Render: set Start Command to:
gunicorn app:app

# Environment variables: set all .env keys in the dashboard
# DATABASE_URL: set to a PostgreSQL URL for production
```

---

## 🛡️ Security Features

- **Rate limiting**: 5 contact submissions / IP / hour  
- **Honeypot field**: bot detection  
- **IP hashing**: SHA-256 — no raw IPs stored  
- **Input validation**: length + email regex on all fields  
- **CORS**: only whitelisted origins accepted  
- **Admin key**: header-based guard for sensitive endpoints  

---

*Built by Siddharth Nishkalan S — B.Tech IT, SKCE*
