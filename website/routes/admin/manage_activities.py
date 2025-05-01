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
from website.models.database_models import Event,Activities



manage_activities = Blueprint('manage_activities', __name__)

#------------------------------------------------------------------------
#activities routes and api 
#------------------------------------------------------------------------

#render manage activity html
@manage_activities.route('/manage_activities_page/<int:event_id>', methods=['GET'])
@login_required
@role_required_multiple('admin','ssg')
def manage_activities_page(event_id):
   
    selected_event=Event.query.get(event_id)
    return render_template('admin/manage_activities.jinja2',selected_event=selected_event)


#get activities table datas
@manage_activities.route('/activities_data', methods=['GET'])
@login_required
@role_required_multiple('admin','ssg')
def activities_data():
    try:
        event_id = request.args.get('event_id')  # Retrieve from URL parameters
        if not event_id:
            return jsonify({'success': False, 'message': 'Missing event_id'}),
        # Fetch all activities associated with the given event_id
        activities = Activities.query.filter(
            Activities.event_id==event_id
            ).all()
        
        
        all_activities=[]
        
        # Create a list of dictionaries containing activity details
        for a in activities:
            activities_data = {

                    'activity_name': a.name,
                    'start_time': a.start_time.strftime('%I:%M %p'),  # Format datetime as string
                    'end_time': a.end_time.strftime('%I:%M %p'),      # Format datetime as string
                    'fines': a.fines,
                    'id': a.id
                }
            
            all_activities.append(activities_data)

            
        # Return the list of activities as a JSON response
        return jsonify({'success': True, 'data': all_activities})

    except Exception as e:
        # Handle any errors and return a meaningful response
        return jsonify({'success': False, 'message': str(e)})
    
    
#add activity
@manage_activities.route('/add_activity', methods=['POST'])
@login_required
@role_required_multiple('admin','ssg')
def add_activity():
    try:
        
        # Get the selected event ID from the form data
        event_id = request.form.get('selected_event_id')
        activity_name = request.form.get('activity_name')
        
        start_time_str = request.form.get('start_time')
        end_time_str = request.form.get('end_time')
        
        fines = request.form.get('fines')  # Default fine to 0 if not provided
        
        # Validate form inputs
        if not event_id:
            return jsonify(success=False, message="Event not found empty.")
        if not activity_name:
            return jsonify(success=False, message="Activity name cannot be empty.")
        if not start_time_str:
            return jsonify(success=False, message="Start time cannot be empty.")
        if not end_time_str:
            return jsonify(success=False, message="End time cannot be empty.")
        if not fines:
            fines=0
        

        # Convert time strings to time objects
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
        end_time = datetime.strptime(end_time_str, '%H:%M').time()

        # Validate time logic
        if start_time >= end_time:
            return jsonify(success=False, message="Start time must be earlier than end time.")
        if end_time <= start_time:
            return jsonify(success=False, message="Activity end time must be after start time.")
        
        # Check for conflicts with existing activities
        existing_activity = Activities.query.filter(
            Activities.event_id==event_id, 
            func.lower(Activities.name)==func.lower(activity_name)
        ).first()

        conflict_activity =Activities.query.filter(
            Activities.event_id == event_id,
            (
                (Activities.start_time < end_time) & (Activities.end_time > start_time)  # Overlaps but allows boundaries
            )
            ).first()

        if existing_activity:
            return jsonify(success=False, message="An activity with the same name already exists.")
        if conflict_activity:
            return jsonify(success=False, message="The activity conflicts with an existing activity time schedule.")
        

        # Create and save the new activity
        new_activity = Activities(
            event_id=event_id,
            name=activity_name,
            start_time=start_time,
            end_time=end_time,
            fines=fines
        )
        db.session.add(new_activity)
        db.session.commit()

        return jsonify(success=True, message="Activity added successfully!")

    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, message=f"An error occurred: {str(e)}")

# Delete event activity
@manage_activities.route('/delete_activity', methods=['DELETE'])
@login_required
@role_required_multiple('admin','ssg')
def delete_activity():
    try:
        
        activity_id = request.json.get('activity_id', [])
        
        activityDel = Activities.query.get(activity_id)
        
        if not activityDel:
            return jsonify({'success': False, 'message': 'Event activity not found'})
        
        db.session.delete(activityDel)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Activities deleted successfully'})
        
    except Exception as e:
        db.session.rollback()  # Rollback the session in case of error
        return jsonify({'success': False, 'message': str(e)})
    
    
#delete selected activities
@manage_activities.route('/delete_selected_activities', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_activities():
    try:
        
        # Get the list of activity IDs from the request
        activities_ids = request.json.get('activities_ids', [])
        
        if not activities_ids:
            return jsonify({'success': False, 'message': 'No activity IDs provided'})

        # Fetch all the activities and delete them
        activities_to_delete = Activities.query.filter(
            Activities.id.in_(activities_ids)
        ).all()
        
        if not activities_to_delete:
            return jsonify({'success': False, 'message': 'No activities found for the provided IDs'})

        # Correct way to delete multiple records
        for activity in activities_to_delete:
            db.session.delete(activity)

        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(activities_to_delete)} activities deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Update Activities
@manage_activities.route('/update_activities', methods=['PUT'])
@login_required
@role_required_multiple('admin','ssg')
def update_activity():
    try:
       
        # Get form data from the request
        selected_event_id = request.form.get('update_selected_event_id')
        selected_activity_id = request.form.get('update_selected_activity_id')
        update_activity_name = request.form.get('update_activity_name')
        update_start_str = request.form.get('update_activity_start_T')
        update_end_str = request.form.get('update_activity_end_T')
        update_fines = request.form.get('update_fines')

        # Check if required fields are empty
        if not selected_event_id:
            return jsonify({'success': False, 'message': 'No event ID provided'})
        
        if not selected_activity_id:
            return jsonify({'success': False, 'message': 'No activity ID provided'})
        
        if not update_activity_name:
            return jsonify({'success': False, 'message': 'Activity name cannot be empty'})

        if not update_start_str:
            return jsonify({'success': False, 'message': 'Activity start time cannot be empty'})

        if not update_end_str:
            return jsonify({'success': False, 'message': 'Activity end time cannot be empty'})
        
        if not update_fines:
            update_fines=0

        # Convert the start and end times to datetime objects
        update_start = datetime.strptime(update_start_str, '%H:%M').time()
        update_end = datetime.strptime(update_end_str, '%H:%M').time()

        # Check for time conflicts
        if update_start >= update_end:
            return jsonify({'success': False, 'message': 'Start time must be before end time'})
        if update_end <= update_start:
            return jsonify(success=False, message="Activity end time must be after start time.")

        # Check for conflicting activities
        existing_activity = Activities.query.filter(
            Activities.event_id == selected_event_id,
            Activities.id != selected_activity_id,

            func.lower(Activities.name) == func.lower(update_activity_name)
        ).first()

        conflict_activity =Activities.query.filter(
            Activities.event_id == selected_event_id,
            Activities.id != selected_activity_id,
            (
                (Activities.start_time < update_end) & (Activities.end_time > update_start)  # Overlaps but allows boundaries
            )
            ).first()

        if existing_activity:
            return jsonify({'success': False, 'message': 'An activity with the same name already exists in this event'})

        if conflict_activity:
            return jsonify({'success': False, 'message': 'There is a time conflict with an existing activity'})

        # Update the activity
        activity_to_update = Activities.query.get(selected_activity_id)
        activity_to_update.event_id = selected_event_id
        activity_to_update.name = update_activity_name
        activity_to_update.start_time = update_start
        activity_to_update.end_time = update_end
        activity_to_update.fines = update_fines
        db.session.commit()

        return jsonify({'success': True, 'message': 'Activity updated successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

