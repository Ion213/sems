from itsdangerous import URLSafeTimedSerializer
from website import mail
from flask_mail import Message
from website.smtp_account import dtc_email


# Secure email verification
def send_verification_email(email, confirm_url):
    msg = Message('Confirm Your Email', sender=dtc_email, recipients=[email])
    msg.body = (
        f"Hello,\n\n"
        f"Please confirm your email address by clicking the link below:\n"
        f"{confirm_url}\n\n"
        f"This link will expire in 3 minutes. If you didn’t request this, please ignore it."
        f"Do not share this link with anyone."
    )
    mail.send(msg)
    
# Send reset email
def send_reset_password_link(email,reset_url):
    msg = Message('Password Reset Request', sender=dtc_email, recipients=[email])
    msg.body = f'Click the link to reset your password: {reset_url}'
    mail.send(msg)

# Secure serializer (initialize in flask_app)
def get_serializer():
    return URLSafeTimedSerializer('ion21')  # Use actual secret key