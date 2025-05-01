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
#from website import db

#from werkzeug.security import generate_password_hash,check_password_hash
from website.security.user_regulator import  redirect_user_based_on_role

from website.models.database_models import User
from website.security.logger import user_request_log


#create blueprint/routes
login = Blueprint('login', __name__)

@login.route('/login_page', methods=['GET', 'POST'])
def login_page():

    if current_user.is_authenticated:
        return redirect_user_based_on_role(current_user.role)
    
    if request.method == 'POST':
        try:
            email = request.form.get('email')
            password = request.form.get('password')

            if not email or not password:
                return jsonify({'success': False, 'message': 'Please input email and password'})
            
            # Fetch user by email and password
            valid_user = User.query.filter_by(
                email=email,
                password=password
                ).first()
            
            if valid_user:

                if not valid_user.is_verified:
                    return jsonify({'success': False, 'message': 'Account not verified. Please check your email inbox or spam for verification link.'})

                login_user(valid_user,remember=True)
                if valid_user.role in ['admin', 'ssg']:
                    user_request_log(valid_user.email)
                    return jsonify({
                            'success': True, 
                            'message': 'You have successfully logged in.',
                            'redirect_url': url_for('dashboard.dashboard_page')
                        })
                else:
                    return jsonify({
                            'success': True, 
                            'message': 'You have successfully logged in.',
                            'redirect_url': url_for('view_events.view_events_page')
                        })
                        

            return jsonify({'success': False, 'message': 'Invalid credentials'})

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error {e}'})

    return render_template('auth/login_page.jinja2')