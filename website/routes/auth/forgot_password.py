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
import re
from pytz import timezone
#from datetime import datetime,time
manila_tz = timezone('Asia/Manila')
#from sqlalchemy.sql import func
from website import db

#from werkzeug.security import generate_password_hash,check_password_hash
from itsdangerous import SignatureExpired, BadSignature
from website.smtp_mailer import get_serializer,send_reset_password_link

from website.models.database_models import User

#create blueprint/routes
forgot_password = Blueprint('forgot_password', __name__)

# Forgot Password Route (Request Reset)
@forgot_password.route('/forgot_password_page', methods=['GET', 'POST'])
def forgot_password_page():
    if request.method == 'POST':
        email = request.form.get('email')

        # Check if email exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'Email not found'})
        
        if not user.is_verified:
            return jsonify({'success': False, 'message': 'This email is not verified. Please verify it first'})

        # Generate reset token
        serializer = get_serializer()
        token = serializer.dumps(email, salt='password-reset')
        reset_url = url_for('forgot_password.reset_password', token=token, _external=True)
        
        send_reset_password_link(email,reset_url)
        return jsonify({'success': True, 'message': 'Password reset link sent. Check your email inbox or spam.'})

    return render_template('auth/forgot_password_page.jinja2')



# Reset Password Route (Token Validation)
@forgot_password.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    serializer = get_serializer()
    try:
        email = serializer.loads(token, salt='password-reset', max_age=180)  # Token expires in minutes
        user = User.query.filter_by(email=email).first()
        
        if request.method == 'POST':
            
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')

            if not new_password or not confirm_password:
                return jsonify({'success': False, 'message': 'All fields are required'})

            if new_password != confirm_password:
                return jsonify({'success': False, 'message': 'Passwords do not match'})
            
            
            if len(new_password) < 6 or len(new_password) > 20:
                return jsonify({'success': False, 'message': 'Password must be greater than 6  and below 20 characters'})
                        # Password strength check
            password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,20}$'
            if not re.match(password_pattern, new_password):
                return jsonify({'success': False, 'message': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.'})
                 

            # Update password (plaintext for now, but hashing recommended)
            user.password = new_password  # Change to generate_password_hash(new_password) in production
            db.session.commit()

            return jsonify({'success': True, 'message': 'Password reset successfully', 'redirect_url': url_for('login.login_page')})

        return render_template('auth/reset_password_page.jinja2', token=token)

    except SignatureExpired:
        return render_template("auth/reset_password_page.jinja2", message="Reset link expired.", success=False)
    except BadSignature:
        return render_template("auth/reset_password_page.jinja2", message="Invalid reset link.", success=False)