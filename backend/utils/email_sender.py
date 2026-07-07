"""
utils/email_sender.py — Email Notification Utility
Sends notification + auto-reply emails via Gmail SMTP (TLS).
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app


def _build_notification(msg) -> MIMEMultipart:
    """HTML email sent to Siddharth notifying of a new message."""
    em = MIMEMultipart("alternative")
    em["Subject"] = f"📬 New Portfolio Message from {msg.name}"
    em["From"]    = current_app.config["MAIL_USERNAME"]
    em["To"]      = current_app.config["MAIL_RECEIVER"]

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ margin:0; padding:0; background:#04090f; font-family:'Segoe UI',sans-serif; }}
    .wrap {{ max-width:560px; margin:30px auto; background:#091220;
             border:1px solid rgba(0,212,255,.2); border-radius:16px; overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0a1628,#0c1f38);
               padding:28px 32px; border-bottom:1px solid rgba(0,212,255,.15); }}
    .header h1 {{ margin:0; color:#00d4ff; font-size:1.1rem; letter-spacing:.06em; }}
    .header p  {{ margin:6px 0 0; color:#7a90b0; font-size:.8rem; }}
    .body  {{ padding:28px 32px; }}
    .row   {{ margin-bottom:18px; }}
    .label {{ font-size:.68rem; text-transform:uppercase; letter-spacing:.14em;
              color:#3a5070; margin-bottom:4px; }}
    .value {{ color:#f0f6ff; font-size:.9rem; line-height:1.6; }}
    .msg-box {{ background:#060e1a; border-radius:10px; padding:16px 18px;
                border:1px solid rgba(0,212,255,.08); color:#b0c4de;
                font-size:.88rem; line-height:1.7; white-space:pre-wrap; }}
    .footer {{ padding:20px 32px; border-top:1px solid rgba(0,212,255,.08);
               font-size:.7rem; color:#3a5070; text-align:center; }}
    .badge {{ display:inline-block; padding:3px 10px; border-radius:4px;
              background:rgba(0,212,255,.08); border:1px solid rgba(0,212,255,.2);
              color:#00d4ff; font-size:.65rem; letter-spacing:.1em; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>📬 New Message — Portfolio</h1>
      <p>Someone reached out via your portfolio contact form.</p>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">From</div>
        <div class="value">{msg.name} &nbsp;<span class="badge">{msg.email}</span></div>
      </div>
      <div class="row">
        <div class="label">Subject</div>
        <div class="value">{msg.subject or 'Portfolio Enquiry'}</div>
      </div>
      <div class="row">
        <div class="label">Message</div>
        <div class="msg-box">{msg.message}</div>
      </div>
      <div class="row">
        <div class="label">Message ID</div>
        <div class="value" style="color:#3a5070;">#{msg.id}</div>
      </div>
    </div>
    <div class="footer">Siddharth Nishkalan · Portfolio Backend · Auto-notification</div>
  </div>
</body>
</html>
"""
    em.attach(MIMEText(html, "html"))
    return em


def _build_autoreply(msg) -> MIMEMultipart:
    """Auto-reply sent to the visitor confirming receipt."""
    em = MIMEMultipart("alternative")
    em["Subject"] = "Thanks for reaching out! — Siddharth Nishkalan"
    em["From"]    = current_app.config["MAIL_USERNAME"]
    em["To"]      = msg.email

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ margin:0; padding:0; background:#04090f; font-family:'Segoe UI',sans-serif; }}
    .wrap {{ max-width:520px; margin:30px auto; background:#091220;
             border:1px solid rgba(0,212,255,.18); border-radius:16px; overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0a1628,#0c1f38);
               padding:32px; border-bottom:1px solid rgba(0,212,255,.12);
               text-align:center; }}
    .badge-sn {{ display:inline-flex; align-items:center; justify-content:center;
                 width:52px; height:52px; border-radius:12px; background:#00d4ff;
                 color:#04090f; font-weight:900; font-size:1.1rem;
                 margin-bottom:14px; box-shadow:0 0 20px rgba(0,212,255,.4); }}
    .header h1 {{ margin:0; color:#f0f6ff; font-size:1.15rem; }}
    .header p  {{ margin:8px 0 0; color:#7a90b0; font-size:.82rem; }}
    .body  {{ padding:32px; color:#b0c4de; font-size:.9rem; line-height:1.75; }}
    .body strong {{ color:#f0f6ff; }}
    .highlight {{ background:rgba(0,212,255,.05); border-left:3px solid #00d4ff;
                  padding:14px 18px; border-radius:0 8px 8px 0; margin:20px 0;
                  font-size:.85rem; color:#7a90b0; }}
    .footer {{ padding:20px 32px; border-top:1px solid rgba(0,212,255,.08);
               font-size:.7rem; color:#3a5070; text-align:center; }}
    a {{ color:#00d4ff; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="badge-sn">SN</div>
      <h1>Hey {msg.name.split()[0]}, thanks for reaching out!</h1>
      <p>I've received your message and will reply within 24 hours.</p>
    </div>
    <div class="body">
      <p>Hi <strong>{msg.name}</strong>,</p>
      <p>
        Thanks for getting in touch through my portfolio. I'm excited to connect!
        I typically respond within <strong>24 hours</strong> on weekdays.
      </p>
      <div class="highlight">
        Your message: "<em>{msg.message[:200]}{'...' if len(msg.message) > 200 else ''}</em>"
      </div>
      <p>
        In the meantime, feel free to explore my projects on
        <a href="https://github.com/siddharthnishkalan">GitHub</a> or connect with me on LinkedIn.
      </p>
      <p>— <strong>Siddharth Nishkalan S</strong><br>
         B.Tech IT · SKCE · Salem, Tamil Nadu</p>
    </div>
    <div class="footer">This is an automated reply. Please do not reply to this email.</div>
  </div>
</body>
</html>
"""
    em.attach(MIMEText(html, "html"))
    return em


def send_contact_email(msg) -> None:
    """
    Sends two emails:
    1. Notification to Siddharth
    2. Auto-reply to the sender
    Raises on SMTP failure (caught by caller).
    """
    username = current_app.config["MAIL_USERNAME"]
    password = current_app.config["MAIL_PASSWORD"]
    server   = current_app.config["MAIL_SERVER"]
    port     = current_app.config["MAIL_PORT"]

    if not username or not password:
        current_app.logger.warning("Email credentials not configured — skipping email send.")
        return

    with smtplib.SMTP(server, port) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(username, password)

        # 1. Notification to portfolio owner
        notif = _build_notification(msg)
        smtp.sendmail(username, current_app.config["MAIL_RECEIVER"], notif.as_string())

        # 2. Auto-reply to sender
        reply = _build_autoreply(msg)
        smtp.sendmail(username, msg.email, reply.as_string())

    current_app.logger.info(f"Emails sent for contact #{msg.id} from {msg.email}")
