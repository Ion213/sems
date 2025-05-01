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

import random
import re
#from werkzeug.security import generate_password_hash,check_password_hash
from website.security.user_regulator import role_required_multiple

from pytz import timezone
from datetime import datetime,time
manila_tz = timezone('Asia/Manila')

from website import db
from website.models.database_models import User,Department

#from sqlalchemy.sql import func
#from itsdangerous import URLSafeTimedSerializer
#from website import mail
#from flask_mail import Message
#from itsdangerous import SignatureExpired, BadSignature

#from website import dtc_email

#create blueprint/routes
change_password = Blueprint('change_password', __name__)


#student change password
@change_password.route('/user_change_password', methods=['POST'])
@login_required
@role_required_multiple('student')
def user_change_password():
    try:
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        # Validate input
        if not current_password or not new_password or not confirm_password:
            return jsonify({'success': False, 'message': 'All fields are required'})
        
        # Check if the current password matches the stored password
        if current_user.password != current_password:
            return jsonify({'success': False, 'message': 'Current password is incorrect'})
        
        if new_password == current_user.password:
            return jsonify({'success': False, 'message': 'You can\'t use your old password as a new password.Please provide a newer password!'})
    
    
        if len(new_password) < 6 or len(new_password) > 20:
            return jsonify({'success': False, 'message': 'New password must be between 6-20 characters.'})
        
        # Password strength check
        password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,20}$'
        if not re.match(password_pattern, new_password):
            return jsonify({'success': False, 'message': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.'})
                   
        
        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'Confirm password not matched to your new password!'})
        
        # Update the password
        current_user.password = new_password
        db.session.commit()

        return jsonify({'success': True, 'message': 'Password updated successfully'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {e}'})