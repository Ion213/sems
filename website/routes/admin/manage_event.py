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
from website.models.database_models import Event,Logs


manage_event = Blueprint('manage_event', __name__)
#------------------------------------------------------------------------
#manage event api 
#------------------------------------------------------------------------

#render manage_event html
@manage_event.route('/manage_event_page', methods=['GET'])
@login_required
@role_required_multiple('admin','ssg')
def manage_event_page():
    
    return render_template('admin/manage_event.jinja2')

#event table data (api)
@manage_event.route('/event_data', methods=['GET'])
@login_required
@role_required_multiple('admin','ssg')
def event_data():
    try:
        #year_filter = request.args.get('year', type=int)
        #name_filter = request.args.get('name', type=str)  # Get the name filter (if any)

        events = Event.query.all()

        # Filter by year if provided
        '''
        if year_filter:
            events = [e for e in events if e.date_created.year == year_filter]
        '''
        # Filter by name if provided (case insensitive search)
        '''
        if name_filter:
            events = [e for e in events if name_filter.lower() in e.event.lower() or name_filter.lower() in e.event_description.lower()]
        '''
        
        all_events = []
        for e in events:
            
            total_fines = sum(f.fines for f in e.activities)
            activity_counts = len(e.activities)
            formatted_fines = '{:,.2f}'.format(total_fines)
            

            event_data = {
                'id': e.id,
                'name': e.name,
                'description': e.description,
                'date_created': e.date_created.strftime('%Y-%B-%d-%A %I:%M %p'),
                'date_updated': e.date_updated.strftime('%Y-%B-%d-%A %I:%M %p') if e.date_updated else None,
                'activity_counts': activity_counts,
                'total_fines': formatted_fines
            }

            all_events.append(event_data)

        return jsonify({'data': all_events})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
    
#add event (api)
@manage_event.route('/add_event', methods=['POST'])
@login_required
@role_required_multiple('admin','ssg')
def add_event():
    try:
        
          
        # Get the event and description values from the form
        event_name = request.form.get('event_name')
        event_description = request.form.get('event_description')
        
        # Check if the event name is empty
        if not event_name:
            return jsonify({'success': False, 'message': 'Event name cannot be empty!'})

        # Check if the event already exists
        existing_event = Event.query.filter(func.lower(Event.name) == func.lower(event_name)).first()
        
        if existing_event:
            return jsonify({'success': False, 'message': 'Event name already exists!'})

        # If description is empty, set it to an empty string
        if not event_description:
            event_description = ""
            

            
        
        # Create a new event
        eventAdd = Event(
            name=event_name, 
            description=event_description,
            date_created=datetime.now(manila_tz).replace(second=0,microsecond=0)
            )
        db.session.add(eventAdd)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Event added successfully!'})

    except Exception as e:
        db.session.rollback()
   
        return jsonify({'success': False, 'message': str(e)})
  
    
# Delete event (api)
@manage_event.route('/delete_event', methods=['DELETE'])
@login_required
@role_required_multiple('admin','ssg')
def delete_event():
    try:
        
        # Fetch the event by ID and delete it
        event_id = request.json.get('event_id', [])
        
        if not event_id:
            return jsonify({'success': False, 'message': 'No event IDs provided'})
        
        event_to_delete = Event.query.get(event_id)
        
        if not event_to_delete:
            return jsonify({'success': False, 'message': 'Event not found'})
        
        db.session.delete(event_to_delete)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Event deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Delete selected events (API)
@manage_event.route('/delete_selected_events', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_events():
    try:
        
        # Get the list of event IDs from the request
        event_ids = request.json.get('event_ids', [])
        
        if not event_ids:
            return jsonify({'success': False, 'message': 'No event IDs provided'})

        # Fetch all the events and delete them
        events_to_delete = Event.query.filter(Event.id.in_(event_ids)).all()
        
        if not events_to_delete:
            return jsonify({'success': False, 'message': 'No events found for the provided IDs'})

        for event in events_to_delete:
            db.session.delete(event)  # Delete each events 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(events_to_delete)} events deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})


# Update event (api)
@manage_event.route('/update_event', methods=['PUT'])
@login_required
@role_required_multiple('admin','ssg')
def update_event():
    try:
       
        event_id = request.form.get('selected_event_id')
        event_name = request.form.get('update_name')
        event_description = request.form.get('update_description')

        # Check if the event name is empty
        if not event_name:
            return jsonify({'success': False, 'message': 'Event name cannot be empty'})

        # Check if the event name already exists
        existing_event = Event.query.filter(Event.id != event_id, func.lower(Event.name) == func.lower(event_name)).first()
        
        if existing_event:
            return jsonify({'success': False, 'message': 'Event name already exists'})
        

        # Update the event
        eventUp = Event.query.get(event_id)
        eventUp.name = event_name
        eventUp.description = event_description
        eventUp.date_updated= datetime.now(manila_tz).replace(second=0, microsecond=0)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Event updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})