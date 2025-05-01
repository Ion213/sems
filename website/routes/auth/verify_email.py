  #libraries needed
from flask import (
    Blueprint, 
    render_template, 
    request, 
    redirect, 
    url_for, 
    flash,
    jsonify
)
from flask_login import (
                        LoginManager,
                         login_user,
                         logout_user,
                         login_required,
                         current_user
                         )

#import random
#import re
from pytz import timezone
#from datetime import datetime,time
manila_tz = timezone('Asia/Manila')
#from sqlalchemy.sql import func
from website import db

from itsdangerous import SignatureExpired, BadSignature
from website.smtp_mailer import send_verification_email,get_serializer
from website.security.request_limiter import user_email_or_ip_limit,user_request_Limit

from website.models.database_models import User

#create blueprint/routes
verify_email = Blueprint('verify_email', __name__)

# Confirm verification with 5-minute expiration
@verify_email.route('/confirm_email/<token>', methods=['GET'])
def confirm_email(token):
    serializer = get_serializer()
    try:
        # Validate the token with a  expiration
        email = serializer.loads(token, salt='email-confirm', max_age=180)

        user = User.query.filter_by(email=email).first()
        if not user:
            return render_template("auth/verify_email_page.jinja2", message="Invalid or expired token", success=False)

        if user.is_verified:
            return render_template("auth/verify_email_page.jinja2", message="This email has already been verified.", success=False)

        # Mark user as verified
        user.is_verified = True
        db.session.commit()

        return render_template("auth/verify_email_page.jinja2", message="Your email has been verified successfully!", success=True)

    except SignatureExpired:
        return render_template("auth/verify_email_page.jinja2", message="The confirmation link has expired. Please request a new one.", success=False)

    except BadSignature:
        return render_template("auth/verify_email_page.jinja2", message="Invalid confirmation link.", success=False)
    
    
#verify resend
@verify_email.route('/resend_verification_email', methods=['POST'])
#@user_email_or_ip_limit.limit("5 per 30 minutes") 
#@user_request_Limit.limit("5 per 30 minutes") 
def resend_verification_email():
    email = request.form.get('email')

    if not email:
        return render_template("auth/verify_email_page.jinja2", message="Email is required.", success=False)

    user = User.query.filter_by(email=email).first()
    if not user:
        return render_template("auth/verify_email_page.jinja2", message="User not found.", success=False)

    if user.is_verified:
        return render_template("auth/verify_email_page.jinja2", message="This email is already verified.", success=False)

    # Generate a new verification token
    serializer = get_serializer()
    token = serializer.dumps(email, salt='email-confirm')
    confirm_url = url_for('verify_email.confirm_email', token=token, _external=True)

    # Send the verification email
    send_verification_email(email, confirm_url)

    return render_template("auth/verify_email_page.jinja2", message="A new verification email has been sent. Check your email inbox or spam.", success=False)
