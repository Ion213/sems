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
from website.models.database_models import Schedule,Sched_activities,User,Payment,Department,Attendance

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/dashboard_page', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def dashboard_page():
    
    schedule = Schedule.query.all()
    payment = Payment.query.all()

    # Collect unique years from each model
    year_s = {s.scheduled_date.year for s in schedule}
    year_p = {p.transaction_date.year for p in payment}


    # Merge all year sets into one
    all_year_set = year_s.union(year_p)

    # Get the most recent year
    most_recent_year = max(all_year_set) if all_year_set else None

    return render_template('admin/dashboard.jinja2',
                           years=sorted(all_year_set, reverse=True), 
                           current_year=most_recent_year)

    
#events
@dashboard.route('/d_schedule_count', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def d_schedule_count():
    selected_year = request.args.get('selected_year', type=int)

    if not selected_year:
        return jsonify({'error': 'Missing selected_year'}), 400

    # Count schedule statuses by year
    upcoming_count = Schedule.query.filter(
        extract('year', Schedule.scheduled_date) == selected_year,
        Schedule.status == 'upcoming'
    ).count()

    ongoing_count = Schedule.query.filter(
        extract('year', Schedule.scheduled_date) == selected_year,
        Schedule.status == 'ongoing'
    ).count()

    completed_count = Schedule.query.filter(
        extract('year', Schedule.scheduled_date) == selected_year,
        Schedule.status == 'ended'
    ).count()
    
    event_count= Schedule.query.filter(
        extract('year', Schedule.scheduled_date) == selected_year,
    ).count()


    return jsonify({
        'upcoming_count': upcoming_count,
        'ongoing_count': ongoing_count,
        'completed_count': completed_count,
        'event_count':event_count
    })
    
#students
@dashboard.route('/d_student_count', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def d_student_count():
    student_count = User.query.filter(
        User.role == 'student',
        User.is_verified == True
    ).count()

    bsis_count = User.query.join(User.department).filter(
        User.role == 'student',
        User.is_verified == True,
        Department.name == 'BSIS'
    ).count()

    crim_count = User.query.join(User.department).filter(
        User.role == 'student',
        User.is_verified == True,
        Department.name == 'CRIMINOLOGY'
    ).count()

    tourism_count = User.query.join(User.department).filter(
        User.role == 'student',
        User.is_verified == True,
        Department.name == 'TOURISM'
    ).count()

    educ_count = User.query.join(User.department).filter(
        User.role == 'student',
        User.is_verified == True,
        Department.name == 'EDUCATION'
    ).count()

    return jsonify({
        'student_count': student_count,
        'bsis_count': bsis_count,
        'crim_count': crim_count,
        'tourism_count': tourism_count,
        'educ_count': educ_count
    })
    
#unpaid fines
@dashboard.route('/d_unpaid_fines', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def d_unpaid_fines():
    
    selected_year = request.args.get('selected_year', type=int)

    if not selected_year:
        return jsonify({'error': 'Missing selected_year'}), 400
    
    fines = db.session.query(func.sum(Attendance.fines)).join(Sched_activities).join(Schedule).filter(
        Attendance.fines!=0,
        Attendance.status!='attended',
        Attendance.is_paid==False,
        Schedule.is_ended==True,
        extract('year',Schedule.scheduled_date)==selected_year
        
    ).scalar() or 0
    
    
    fines_for_users = db.session.query(Attendance.student_id).join(Sched_activities).join(Schedule).filter(
        Attendance.fines != 0,
        Attendance.status != 'attended',
        Attendance.is_paid == False,
        Schedule.is_ended == True,
        extract('year', Schedule.scheduled_date) == selected_year
    ).all()

    # Flatten list of tuples
    user_ids = [uid for (uid,) in fines_for_users]

    fines_count = User.query.filter(User.id.in_(user_ids)).count()

    return jsonify({
    'fines': f"₱{float(fines):,.2f}",
    'fines_count':fines_count
    })

#paid fines
@dashboard.route('/d_paid_fines', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def d_paid_fines():
    selected_year = request.args.get('selected_year', type=int)

    if not selected_year:
        return jsonify({'error': 'Missing selected_year'}), 400

    paid_fines = db.session.query(func.sum(Payment.amount_paid)).filter(
        extract('year', Payment.transaction_date) == selected_year
    ).scalar() or 0

    # Unpaid and paid students (with fines)
    fines_for_users = db.session.query(Attendance.student_id).join(Sched_activities).join(Schedule).filter(
        Attendance.fines != 0,
        Attendance.status != 'attended',
        Attendance.is_paid == False,
        Schedule.is_ended == True,
        extract('year', Schedule.scheduled_date) == selected_year
    ).all()

    paid_fines_for_users = db.session.query(Attendance.student_id).join(Sched_activities).join(Schedule).filter(
        Attendance.fines != 0,
        Attendance.status != 'attended',
        Attendance.is_paid == True,
        Schedule.is_ended == True,
        extract('year', Schedule.scheduled_date) == selected_year
    ).all()

    # Flatten tuples
    unpaid_user_ids = [uid for (uid,) in fines_for_users]
    paid_user_ids = [uid for (uid,) in paid_fines_for_users]

    # Exclude users with unpaid fines from paid list
    full_paid_count = User.query.filter(
        User.id.in_(paid_user_ids),
        ~User.id.in_(unpaid_user_ids)  # Correct syntax here
    ).count()
    
    initially_paid_count = User.query.filter(
        User.id.in_(paid_user_ids),
        User.id.in_(unpaid_user_ids)  # Correct syntax here
    ).count()
    
    return jsonify({
        'paid_fines': f"₱{float(paid_fines):,.2f}",
        'full_paid_count': full_paid_count,
        'initially_paid_count':initially_paid_count
    })
    

#chart payments  
@dashboard.route('/payment_chart_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def payment_chart_data():
    selected_year = request.args.get('selected_year', type=int)
    
    if not selected_year:
        return jsonify({'error': 'Missing selected_year'}), 400
    
    schedules = Schedule.query.filter(
        extract('year', Schedule.scheduled_date) == selected_year,
        Schedule.is_ended == True
    ).all()
    
    all_payment_data = []
    
    for s in schedules:
        # Sum of paid fines for this event
        paid_sum = db.session.query(func.sum(Attendance.fines)).join(Sched_activities).filter(
            Attendance.fines != 0,
            Attendance.status != 'attended',
            Attendance.is_paid == True,
            Sched_activities.schedule_id == s.id
        ).scalar() or 0
        
        # Sum of unpaid fines for this event
        unpaid_sum = db.session.query(func.sum(Attendance.fines)).join(Sched_activities).filter(
            Attendance.fines != 0,
            Attendance.status != 'attended',
            Attendance.is_paid == False,
            Sched_activities.schedule_id == s.id
        ).scalar() or 0
        
        payment_data = {
            'event_name': s.name,
            'event_schedule': s.scheduled_date.strftime('%Y-%m-%d'),
            'amount_paid_for_this_event': float(paid_sum),
            'amount_unpaid_for_this_event': float(unpaid_sum),
        }
        all_payment_data.append(payment_data)
        
    return jsonify(all_payment_data)



#chart attendance
@dashboard.route('/attendance_chart_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def attendance_chart_data():
    selected_year = request.args.get('selected_year', type=int)
    
    if not selected_year:
        return jsonify({'error': 'Missing selected_year'}), 400
    
    
    sched_activities= db.session.query(Sched_activities).join(Schedule).filter(
        extract('year', Schedule.scheduled_date) == selected_year,
        Schedule.is_ended == True
    ).all()
    
    all_attendance_data = []
    
    for s in sched_activities:

        attended_in_the_event = db.session.query(Attendance.student_id).join(Sched_activities).filter(
            Attendance.status == 'attended',
            Schedule.is_ended==True,
            Sched_activities.id==s.id
        ).all()

        absent_in_the_event = db.session.query(Attendance.student_id).join(Sched_activities).filter(
            Attendance.status == 'absent',
            Schedule.is_ended==True,
            Sched_activities.id==s.id
        ).all()
        
        missed_out_in_the_event = db.session.query(Attendance.student_id).join(Sched_activities).filter(
            Attendance.status == 'missed_out',
            Schedule.is_ended==True,
            Sched_activities.id==s.id
        ).all()
        
        missed_in_in_the_event = db.session.query(Attendance.student_id).join(Sched_activities).filter(
            Attendance.status == 'missed_in',
            Schedule.is_ended==True,
            Sched_activities.id==s.id
        ).all()
        
        attended_user_ids = [uid for (uid,) in attended_in_the_event]
        absent_user_ids = [uid for (uid,) in absent_in_the_event]
        missed_out_user_ids = [uid for (uid,) in missed_out_in_the_event]
        missed_in_user_ids = [uid for (uid,) in missed_in_in_the_event]
        
        attended = User.query.filter(
        User.id.in_(attended_user_ids),
        ).count()
        
        absent = User.query.filter(
        User.id.in_(absent_user_ids),
        ).count()
        
        missed_out = User.query.filter(
        User.id.in_(missed_out_user_ids),
        ).count()
        
        missed_in = User.query.filter(
        User.id.in_(missed_in_user_ids),
        ).count()
        
        attendance_data = {
            'event_name': f'{s.schedule.name} - {s.name}',
            'event_schedule': s.schedule.scheduled_date.strftime('%Y-%m-%d'),
            'attended':attended,
            'absent':absent,
            'missed_out':missed_out,
            'missed_in':missed_in
        }
        all_attendance_data.append(attendance_data)

    return jsonify(all_attendance_data)