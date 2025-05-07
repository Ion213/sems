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
manila_tz = timezone('Asia/Manila')
from datetime import datetime
from sqlalchemy import or_,and_,extract
from sqlalchemy.sql import func

from website import db
from website.models.database_models import Event, Activities,Schedule,Sched_activities,Attendance

view_attendance_fine= Blueprint('view_attendance_fine', __name__)

#render attendance html
@view_attendance_fine.route('/view_attendance_fine_page', methods=['GET'])
@login_required
@role_required_multiple('student')
def view_attendance_fine_page():
    
    attendance=db.session.query(Attendance).join(Sched_activities).join(Schedule).filter(
        Attendance.student_id==current_user.id,
        Attendance.status !="attended",
        Attendance.is_paid==False,
        Schedule.is_ended==True
    )


    schedule = Schedule.query.all()
    years = {s.scheduled_date.year for s in schedule}  # Get unique years from event data
    # Get the most recent year
    most_recent_year = max(years) if years else None
    
    status=["absent","missed_out","attended","missed_in"]
    pay_status=[0,1] # true or false
    
     # Calculate current balance from fines
    current_balance = sum(a.fines for a in attendance if a.fines)
    return render_template('user/view_attendance_fine.jinja2',
                           current_balance = "{:.2f}".format(current_balance),
                           years=sorted(years, reverse=True), 
                           most_recent_year=most_recent_year,
                           status=status,
                           pay_status=pay_status
                           )
# Get user attendance data
@view_attendance_fine.route('/user_view_attendance_fine_data', methods=['GET'])
@login_required
@role_required_multiple('student')
def user_view_attendance_fine_data():
    try:
        # Get filter values from request
        date_year = request.args.get('date_year', '').strip()
        status = request.args.get('status', '').strip()
        pay_status = request.args.get('pay_status', '').strip()

        # 🛑 Stop if no year is selected
        if not date_year:
            return jsonify({'data': []})

        # Base query
        query = db.session.query(Attendance).join(Sched_activities).join(Schedule).filter(
            Attendance.student_id == current_user.id,
            Schedule.is_ended==True
        )

        # Filter by attendance status (absent, attended, etc.)
        if status:
            query = query.filter(Attendance.status == status)

        # Filter by payment status (0 or 1) safely
        if pay_status != '':
            paid_status = int(pay_status)
            query = query.filter(
                Attendance.is_paid == paid_status,
                Attendance.status!="attended"
                )

        # Fetch results
        attendance = query.all()
        all_attendance = []

        for a in attendance:
            if a.status == "attended" and a.is_paid==False:
                pay_stats = "--"
    
                
            if a.status != "attended" and a.is_paid ==False:
                pay_stats = "Unpaid ❌"
                
            if a.status !="attended" and a.is_paid==True:
                pay_stats = "Paid ✅"
                
            
            schedule_data = {
                'event_name': a.sched_activities.schedule.name,
                'event_date': a.sched_activities.schedule.scheduled_date.strftime('%Y-%B-%d'),
                'activity_name': a.sched_activities.name,
                'time_in': a.time_in.strftime('%I:%M %p') if a.time_in else "❌",
                'time_out': a.time_out.strftime('%I:%M %p') if a.time_out else "❌",
                'status': a.status,
                'fines': f'₱{a.fines:.2f}',
                'payment_status':pay_stats,
            }
            all_attendance.append(schedule_data)

        return jsonify({'data': all_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
