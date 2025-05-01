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
#from website import db
#from sqlalchemy.sql import func


#create blueprint/routes
log_out = Blueprint('log_out', __name__)

#logout user
@log_out.route('/user_logout', methods=['POST'])  # Ensure this is POST, not GET
@login_required
def user_logout():
    logout_user()  # Example if using Flask-Login
    return jsonify({
        'success': True,
        'redirect_url': url_for('login.login_page')
    })