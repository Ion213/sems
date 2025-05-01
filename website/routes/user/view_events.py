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

view_events= Blueprint('view_events', __name__)



#render events html
@view_events.route('/view_events_page', methods=['GET'])
@login_required
@role_required_multiple('student')
def view_events_page():
    
    # Fetch all events to extract years
    schedule = Schedule.query.all()
    years = {s.scheduled_date.year for s in schedule}  # Get unique years from event data

    # Get the most recent year
    most_recent_year = max(years) if years else None
    return render_template('user/view_events.jinja2',
                           schedule=schedule,
                           years=sorted(years, reverse=True), 
                           most_recent_year=most_recent_year
                           
                           )

#get upcoming events data (api)
@view_events.route('/upcoming_events_data', methods=['GET'])
@login_required
@role_required_multiple('student')
def upcoming_events_data():
    try:
        schedule = Schedule.query.filter(
            Schedule.is_ended ==False,
            Schedule.status=='upcoming'
            ).all()
        
        all_schedule = []
        
        for s in schedule:
            
            # Calculate total fines
            total_fines = db.session.query(func.sum(Sched_activities.fines)).filter(
                Sched_activities.schedule_id == s.id
            ).scalar() or 0.0  # Ensure it's not None

            # Count activities
            activity_count = db.session.query(func.count(Sched_activities.id)).filter(
                Sched_activities.schedule_id == s.id
            ).scalar() or 0  # Ensure it's not None
            

            schedule_data={
                'id': s.id,
                'name': s.name, 
                'scheduled_date': s.scheduled_date.strftime('%Y-%B-%d-%A'),
                'total_fines': f'₱{total_fines:.2f}',  # Format as currency
                'activity_count': activity_count,  # Include activity count
                'status': f'🕓{s.status}'
            }
            
            all_schedule.append(schedule_data)


        return jsonify({'data': all_schedule})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
    
    
#get events activities data
@view_events.route('/events_activities_data', methods=['GET'])
@login_required
@role_required_multiple('student')
def events_activities_data():
    try:
       # Get sched_id from query parameters
        sched_id = request.args.get('sched_id')

        if not sched_id:
            return jsonify({'success': False, 'message': 'Missing sched_id'})
        
        activities = Sched_activities.query.filter(
            Sched_activities.schedule_id==sched_id,
            ).all()
        

        all_activities=[]
        # Create a list of dictionaries containing activity details
        for a in activities:

            activities_data = {
                    'name': a.name,
                    'start_time': a.start_time.strftime('%I:%M %p'),  # Format datetime as string
                    'end_time': a.end_time.strftime('%I:%M %p'),      # Format datetime as string
                    'fines': f'₱{a.fines:.2f}',
                }
            
            all_activities.append(activities_data)
            
        # Return the list of activities as a JSON response
        return jsonify({'success': True, 'data': all_activities})

    except Exception as e:
        # Handle any errors and return a meaningful response
        return jsonify({'success': False, 'message': str(e)})
    
    
#get ongoing events data (api)
@view_events.route('/ongoing_events_data', methods=['GET'])
@login_required
@role_required_multiple('student')
def ongoing_events_data():
    try:
        schedule = Schedule.query.filter(
            Schedule.is_ended ==False,
            Schedule.status=='ongoing'
            ).all()
        
        all_schedule = []
        
        for s in schedule:
            
            # Calculate total fines
            total_fines = db.session.query(func.sum(Sched_activities.fines)).filter(
                Sched_activities.schedule_id == s.id
            ).scalar() or 0.0  # Ensure it's not None

            # Count activities
            activity_count = db.session.query(func.count(Sched_activities.id)).filter(
                Sched_activities.schedule_id == s.id
            ).scalar() or 0  # Ensure it's not None
            

            schedule_data={
                'id': s.id,
                'name': s.name, 
                'scheduled_date': s.scheduled_date.strftime('%Y-%B-%d-%A'),
                'total_fines': f'₱{total_fines:.2f}',  # Format as currency
                'activity_count': activity_count,  # Include activity count
                'status': f'⏳{s.status}'
            }
            
            all_schedule.append(schedule_data)


        return jsonify({'data': all_schedule})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
 
#get completed events data (api)
@view_events.route('/completed_events_data', methods=['GET'])
@login_required
@role_required_multiple('student')
def completed_events_data():
    try:
        year_filter = request.args.get('year', type=int)
        all_schedule = []
        
        if year_filter:
             # Get all schedules where the date is today
            schedule = Schedule.query.filter(
                extract('year', Schedule.scheduled_date) == year_filter,
                Schedule.is_ended==True,
                Schedule.status=="ended"
                ).all()
            
            for s in schedule:
            
                # Calculate total fines
                total_fines = db.session.query(func.sum(Sched_activities.fines)).filter(
                    Sched_activities.schedule_id == s.id
                ).scalar() or 0.0  # Ensure it's not None

                # Count activities
                activity_count = db.session.query(func.count(Sched_activities.id)).filter(
                    Sched_activities.schedule_id == s.id
                ).scalar() or 0  # Ensure it's not None
                

                schedule_data={
                    'id': s.id,
                    'name': s.name, 
                    'scheduled_date': s.scheduled_date.strftime('%Y-%B-%d-%A'),
                    'total_fines': f'₱{total_fines:.2f}',  # Format as currency
                    'activity_count': activity_count,  # Include activity count
                    'status': f' ✅{s.status}'
                }
                
                all_schedule.append(schedule_data)
                
        return jsonify({'data': all_schedule})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})