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
from website.models.database_models import Event, Activities,Schedule,Sched_activities,User,Attendance


manage_schedule = Blueprint('manage_schedule', __name__)


#render schedule template
@manage_schedule.route('/manage_schedule_page', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def manage_schedule_page():
    
    events=Event.query.all()
    
    # Fetch all events to extract years
    schedule = Schedule.query.all()
    years = {s.scheduled_date.year for s in schedule}  # Get unique years from event data

    # Get the most recent year
    most_recent_year = max(years) if years else None
        
    return render_template('admin/manage_schedule.jinja2',
                           events=events, 
                           years=sorted(years, reverse=True), 
                           most_recent_year=most_recent_year
                           )



#get upcoming schedule data (api)
@manage_schedule.route('/schedule_data_upcoming', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def schedule_data_upcoming():
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
    
    
    
#---------

#add schedule  
@manage_schedule.route('/add_schedule', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_schedule():
    try:
        
        event_id = request.form.get('event_id')
        scheduled_date_str = request.form.get('schedule_date')
        
        if not event_id:
            return jsonify({'success': False, 'message': 'Event ID is required'})

        # Check if the schedule date is empty
        if not scheduled_date_str:
            return jsonify({'success': False, 'message': 'Schedule Date cannot be empty'})
        
        
        scheduled_date = datetime.strptime(scheduled_date_str, '%Y-%m-%d')
        
        events= Event.query.get(event_id)
        
        if not events:
            return jsonify({'success': False, 'message': 'Event not found'})
        
        activities=Activities.query.filter_by(event_id=event_id).all()

        if not activities:
            return jsonify({'success': False, 'message': 'Please add activity first in the selected event'})

        # Check if the schedule date is in future
        if scheduled_date.date()< datetime.now(manila_tz).date():
            return jsonify({'success': False, 'message': 'Schedule date must be in the future'})

        # Check if the schedule activities time is in future
        for activity in activities:
            if (scheduled_date.date() == datetime.now(manila_tz).date() and
                    activity.start_time < datetime.now(manila_tz).time().replace(second=0, microsecond=0)):
                return jsonify({'success': False, 'message': 'Activities in today\'s schedule must be in the future'})
            
        name_conflic=Schedule.query.filter(
            Schedule.name==events.name,
            Schedule.is_ended==False,
            or_(
                Schedule.status=="ongoing",
                Schedule.status=="upcomng",
                
            )
        ).first()
        
        if name_conflic:
            return jsonify({'success': False, 'message': 'The selected event is already in schedule ,please wait until it\'s completed'})
        
        schedule_conflict = Schedule.query.filter(
            Schedule.scheduled_date == scheduled_date,
            Schedule.is_ended == False,
        ).first()

        if schedule_conflict:
            return jsonify({'success': False, 'message': 'The selected schedule conflicts with an already scheduled event'})


        all_students=User.query.filter(
            User.is_verified==True,
            User.is_deactivated==False,
            User.role=="student"
        ).all()
        

        # Add and commit all together
        scheduleAdd = Schedule(
            name=events.name,
            scheduled_date=scheduled_date, 
            is_ended = False,
        )
        db.session.add(scheduleAdd)
        db.session.flush()  # Get schedule ID without committing
        


        # Prepare and add scheduled activities
        scheduled_activities = []
        for activity in activities:
            if not activity.start_time or not activity.end_time:
                return jsonify({'success': False, 'message': f'Activity "{activity.name}" must have valid start and end times'})
            
            start_timeWdate = datetime.combine(scheduled_date.date(), activity.start_time).replace(second=0, microsecond=0)
            end_timeWdate = datetime.combine(scheduled_date.date(), activity.end_time).replace(second=0, microsecond=0)
            
            scheduled_activities.append(Sched_activities(
                name=activity.name,
                start_time=start_timeWdate,
                end_time=end_timeWdate,
                fines=activity.fines,
                schedule_id=scheduleAdd.id  # Corrected from sched_id
            ))
        db.session.add_all(scheduled_activities)
        db.session.flush()
        
        if all_students:
            attendances_to_add = []
            for scheduled_activity in scheduled_activities:
                for student in all_students:
                    attendances_to_add.append(Attendance( 
                        time_in=None,
                        time_out=None,
                        fines=scheduled_activity.fines,
                        sched_activities_id=scheduled_activity.id,
                        student_id=student.id                         
                    ))
            db.session.add_all(attendances_to_add)
            db.session.flush()
            
        db.session.commit()
        return jsonify({'success': True, 'message': 'Schedule Added successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})


#------

#get ongoing schedule data (api)
@manage_schedule.route('/schedule_data_ongoing', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def schedule_data_ongoing():
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
    
#---

#get completed schedule data (api)
@manage_schedule.route('/schedule_data_completed', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def schedule_data_completed():
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



#delete schedule upcoming/ongoing/completed
@manage_schedule.route('/delete_schedule', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_schedule():
    try:
        
       
        # Fetch the Schedile by ID and delete it
        sched_id = request.json.get('sched_id', [])
        
        if not sched_id:
            return jsonify({'success': False, 'message': 'No Schedule ID provided'})
         # Fetch the schedule first
        scheduleDel = Schedule.query.get(sched_id)
        if not scheduleDel:
            return jsonify({'success': False, 'message': 'Schedule not found'})


        db.session.delete(scheduleDel)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Schedule canceled successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    

# Delete selected schedule (API) upcoming/ongoing/completed
@manage_schedule.route('/delete_selected_schedules', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_schedules():
    try:
        
        # Get the list of scheds IDs from the request
        sched_ids = request.json.get('sched_ids', [])
        
        if not sched_ids:
            return jsonify({'success': False, 'message': 'No schedule IDs provided'})

        # Fetch all the schedule and delete them
        scheds_to_delete = Schedule.query.filter(
            Schedule.id.in_(sched_ids)
            ).all()
        
        if not scheds_to_delete:
            return jsonify({'success': False, 'message': 'No schedule found for the provided IDs'})

        for sched in scheds_to_delete:
            db.session.delete(sched)  # Delete the event itself
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(scheds_to_delete)} schedule deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    

#update schedule
@manage_schedule.route('/update_schedule', methods=['PUT'])
@login_required
@role_required_multiple('admin', 'ssg')
def update_schedule():
    try:
        
        selected_schedule_id = request.form.get('update_selected_schedule_id')
        
        update_schedule_date_str = request.form.get('update_schedule_date')

        if not selected_schedule_id:
                    return jsonify({'success': False, 'message': 'No schedule ID provided'})

        if not update_schedule_date_str:
            return jsonify({'success': False, 'message': 'Schedule Date cannot be empty'})
        
        activities=Sched_activities.query.filter_by(schedule_id=selected_schedule_id).all()
        
        if not activities:
            return jsonify({'success': False, 'message': 'Please add activity first in this event'})
        
        update_schedule_date = datetime.strptime(update_schedule_date_str, '%Y-%m-%d')
        
        if update_schedule_date.date()< datetime.now(manila_tz).date():
            return jsonify({'success': False, 'message': 'Scheduled date must be in the future'}) 
        
        # Check if the schedule date is in future
        for activity in activities:
            if (update_schedule_date.date() == datetime.now(manila_tz).date() and
                    activity.start_time.time() < datetime.now(manila_tz).time().replace(second=0, microsecond=0)):
                return jsonify({'success': False, 'message': 'Activities in today\'s schedule must be in the future'})
           
        schedule_conflict = Schedule.query.filter(
            Schedule.id != selected_schedule_id,
            Schedule.scheduled_date == update_schedule_date,
            Schedule.is_ended == False,
        ).first()

        if schedule_conflict:
            return jsonify({'success': False, 'message': 'The selected schedule conflicts with an already scheduled event'})


        # Update each activity's date and time
        for activity in activities:
            if not activity.start_time or not activity.end_time:
                return jsonify({'success': False, 'message': f'Activity "{activity.name}" must have valid start and end times'})

            activity.start_time = datetime.combine(update_schedule_date.date(), activity.start_time.time()).replace(second=0, microsecond=0)
            activity.end_time = datetime.combine(update_schedule_date.date(), activity.end_time.time()).replace(second=0, microsecond=0)


        scheduleUp = Schedule.query.get(selected_schedule_id)
        scheduleUp.scheduled_date = update_schedule_date
        db.session.commit()
        return jsonify({'success': True, 'message': 'Schedule updated successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    

#get Sched_activities data
@manage_schedule.route('/sched_activities_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def sched_activities_data():
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