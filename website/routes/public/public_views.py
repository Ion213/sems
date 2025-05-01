#libraries needed
from flask import (
    Blueprint, 
    render_template, 
    request, 
    redirect, 
    url_for, 
    flash
)
from flask_login import (
                        LoginManager,
                         login_user,
                         logout_user,
                         login_required,
                         current_user
                         )


from sqlalchemy.sql import func
from website import db
from website.models.database_models import Sched_activities,Schedule
from pytz import timezone
manila_tz = timezone('Asia/Manila')
from datetime import datetime


from website.security.user_regulator import redirect_user_based_on_role

public_views = Blueprint('public_views', __name__)

@public_views.route('/', methods=['GET', 'POST'])
def event_preview():
    if current_user.is_authenticated:
        return redirect_user_based_on_role(current_user.role)

    # Query upcoming events
    upcoming_events = Schedule.query.filter(
        Schedule.is_ended==False,
        Schedule.status=="upcoming"
    ).order_by(Schedule.scheduled_date.asc()).all()

    # Query ongoing events by joining with Sched_activities
    ongoing_events = db.session.query(Schedule).join(Sched_activities).filter(
        Schedule.is_ended==False,
        Schedule.status=="ongoing"
    ).order_by(Schedule.scheduled_date.asc()).all()

    return render_template('public/event_preview.jinja2', upcoming_events=upcoming_events, ongoing_events=ongoing_events)