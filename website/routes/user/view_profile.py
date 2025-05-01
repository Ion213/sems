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


from website.security.user_regulator import role_required_multiple

from pytz import timezone
from sqlalchemy import func
from datetime import datetime,time
manila_tz = timezone('Asia/Manila')
from sqlalchemy import or_,and_,extract
from website import db
from website.models.database_models import Schedule,User


view_profile= Blueprint('view_profile', __name__)

#------------------------------------------------------------------------
#activities routes and api 
#------------------------------------------------------------------------
#render profile page user
@view_profile.route('/view_profile_page/', methods=['GET', 'POST'])
@login_required
@role_required_multiple('student')
def view_profile_page():
    


    return render_template('user/view_profile.jinja2',)