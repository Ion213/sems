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
from website.models.database_models import Schedule,User,Department,Sched_activities,Attendance


manage_attendance = Blueprint('manage_attendance', __name__)

#------------------------------------------------------------------------
#attendance routes and api 
#------------------------------------------------------------------------

#render manage attendance html
@manage_attendance.route('/manage_attendance_page', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def manage_attendance_page():
    

    ongoing_event = Schedule.query.filter(
        Schedule.is_ended==False,
        Schedule.status=="ongoing"
    ).first()

    # Initialize activities list
    activities = []

    if ongoing_event:
        activities = Sched_activities.query.filter(
            Sched_activities.schedule_id == ongoing_event.id
        ).all()

        # Sort activities by current time proximity
        activities.sort(key=lambda act: (
            act.end_time.time() < datetime.now(manila_tz).time(),
            act.start_time.time()
        ))
       
                
    #for categorized fetch
    # Fetch all departments
    department = Department.query.all()
    
    # Use sets to store unique values
    course_set = set()
    year_set = set()
    section_set = set()
    
    for d in department:
        course_set.add(d.name)
        year_set.add(d.year)
        section_set.add(d.section)
        
    # Convert sets back to lists
    course = list(course_set)
    year = list(year_set)
    section = list(section_set) 
    
    status=["attended","absent","missed_out"]
    
    return render_template(
        'admin/manage_attendance.jinja2',
        ongoing_event=ongoing_event if ongoing_event else None,
        activities=activities if ongoing_event else None,
        course=course,
        year= year,
        section = section,
        status=status
    )
    
    
#-----------------ongoing events
# Get attendance data
@manage_attendance.route('/ongoing_attendance_data/', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def ongoing_attendance_data():
    try:
        # Get filter values from request
        selected_activity = request.args.get('activity', '').strip()
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()
        
        # 🛑 Stop if no activity is selected
        if not selected_activity:
            return jsonify({'data': []})

        # Base query
        query = db.session.query(Attendance).join(User).join(Sched_activities).join(Department)

        # Filter by activity if provided
        if selected_activity:
            query = query.filter(
                Sched_activities.id == selected_activity,
                or_(
                    Attendance.status == 'attended',
                    Attendance.status == 'missed_out'
                )
                                 )
        # Apply dynamic filters
        if selected_course:
            query = query.filter(Department.name == selected_course)
        if selected_year:
            query = query.filter(Department.year == selected_year)
        if selected_section:
            query = query.filter(Department.section == selected_section)

        # Fetch results
        attendance = query.all()
        all_attendance = []

        for a in attendance:
            schedule_data = {
                'id': a.id,
                'student_name': f"{a.user.first_name} {a.user.last_name}",
                'time_in': a.time_in.strftime('%I:%M %p') if a.time_in else None,
                'time_out': a.time_out.strftime('%I:%M %p') if a.time_out else None,
                'department': a.user.department.name,
                'year': a.user.department.year,
                'section': a.user.department.section,
            }
            all_attendance.append(schedule_data)

        return jsonify({'data': all_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
    
#filter
@manage_attendance.route('/filter_student', methods=['GET'])
@login_required
@role_required_multiple('admin','ssg')
def filter_student():
    try:
        input = request.args.get('input', '').lower()
        if input:
            # Query the database for users matching the name in first_name or last_name
            filtered_users = User.query.filter(
                and_(
                    User.role == 'student',
                    User.is_deactivated==False,
                    User.is_verified==True,
                    or_(
                        func.lower(User.first_name).ilike(f"%{input}%"),
                        func.lower(User.last_name).ilike(f"%{input}%"),
                        (func.lower(User.first_name) + "" + func.lower(User.last_name)).ilike(f"%{input}%"),  # Match full name no space
                        (func.lower(User.first_name) + " " + func.lower(User.last_name)).ilike(f"%{input}%"),  # Match full name with space
                        (func.lower(User.last_name) + "" + func.lower(User.first_name)).ilike(f"%{input}%") , # Match full name reverse no space
                        (func.lower(User.last_name) + " " + func.lower(User.first_name)).ilike(f"%{input}%") , #  Match full name reverse with space

                        
                    )
                )
            ).all()

            users=[]
            for user in filtered_users:

                user_data={
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'department':user.department.name +" "+ user.department.year +"-"+ user.department.section
                }
                users.append(user_data)

            return jsonify({'user': users})
        else:
            return jsonify({"user": []})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})    
    
    
#add attendeess IN
@manage_attendance.route('/add_student_in', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_in():
    try:
        
        student_id = request.json.get('student_id',[])
        activity_id = request.json.get('activity_id',[])
        

        if not student_id:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.id==student_id,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student_id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name} already Time In ❌'})
            
            existing_attendance_record.time_in=datetime.now(manila_tz).replace(second=0,microsecond=0)
            existing_attendance_record.status="missed_out"
            existing_attendance_record.fines = (activity.fines / 2) if activity.fines else 0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})
            

        # Create a new attendance record
        attendeeAdd = Attendance(
            sched_activities_id=activity_id, 
            student_id=student_id,  # Ensure the column matches your model
            time_in=datetime.now(manila_tz).replace(second=0, microsecond=0) , # Set the correct time zone
            status="missed_out",
            fines=activity.fines/2 if activity.fines else 0
        )
        db.session.add(attendeeAdd)
        db.session.commit()

        return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
#add attendeess OUT
@manage_attendance.route('/add_student_out', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_out():
    try:
       
        student_id = request.json.get('student_id',[])
        activity_id = request.json.get('activity_id',[])

        if not student_id:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.id==student_id,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student_id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if not existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})
            
            if existing_attendance_record.time_out:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Already Time Out❌'})
            
            existing_attendance_record.time_out=datetime.now(manila_tz).replace(second=0,microsecond=0)
            existing_attendance_record.status="attended"
            existing_attendance_record.fines=0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time Out successfully ✅'})
            

        return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#delete attendance
@manage_attendance.route('/delete_attendance', methods=['DELETE'])
@login_required
@role_required_multiple('admin','ssg')
def delete_attendance():
    try:
       

        attendance_id = request.json.get('attendance_id', [])
        
        if not attendance_id:
            return jsonify({'success': False, 'message': 'Attendance ID not provided'})

        # Fetch the attendance record by ID
        attendanceDel = Attendance.query.get(attendance_id)
        
        # If the attendance record doesn't exist, return an error message
        if not attendanceDel:
            return jsonify({'success': False, 'message': 'Attendance not found'})
        
        attendanceDel.time_in=None
        attendanceDel.time_out=None
        attendanceDel.status="absent"
        attendanceDel.fines=attendanceDel.sched_activities.fines
        db.session.commit()
        # Return a success message
        return jsonify({'success': True, 'message': f'{attendanceDel.user.first_name} {attendanceDel.user.last_name} removed successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
#delete selected attendance   
@manage_attendance.route('/delete_selected_attendance', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_attendance():
    try:
        
        # Get the list of event IDs from the request
        attendance_ids = request.json.get('attendance_ids', [])
        
        if not attendance_ids:
            return jsonify({'success': False, 'message': 'No attendances IDs provided'})

        # Fetch all the events and delete them
        attendance_to_delete = Attendance.query.filter(Attendance.id.in_(attendance_ids)).all()
        
        if not attendance_to_delete:
            return jsonify({'success': False, 'message': 'No Attendance found for the provided IDs'})

        for attendance in attendance_to_delete:
            attendance.time_in=None
            attendance.time_out=None
            attendance.status="absent"
            attendance.fines=attendance.sched_activities.fines
            db.session.commit()  # Delete each events 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(attendance_to_delete)} attendance removed successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#add attendeess IN QR
@manage_attendance.route('/add_student_in_QR', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_in_QR():
    try:
        
        student_ID = request.json.get('student_ID',[])
        activity_id = request.json.get('activity_id',[])
        

        if not student_ID:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.student_ID==student_ID,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student.id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name} already Time In ❌'})
            
            existing_attendance_record.time_in=datetime.now(manila_tz).replace(second=0,microsecond=0)
            existing_attendance_record.status="missed_out"
            existing_attendance_record.fines = (activity.fines / 2) if activity.fines else 0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})
            

        # Create a new attendance record
        attendeeAdd = Attendance(
            sched_activities_id=activity_id, 
            student_id=student.id,  # Ensure the column matches your model
            time_in=datetime.now(manila_tz).replace(second=0, microsecond=0) , # Set the correct time zone
            status="missed_out",
            fines=activity.fines/2 if activity.fines else 0
        )
        db.session.add(attendeeAdd)
        db.session.commit()

        return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#add attendeess OUT QR
@manage_attendance.route('/add_student_out_QR', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_out_QR():
    try:
        
        student_ID = request.json.get('student_ID',[])
        activity_id = request.json.get('activity_id',[])

        if not student_ID:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.student_ID==student_ID,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student.id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if not existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})
            
            if existing_attendance_record.time_out:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Already Time Out❌'})
            
            existing_attendance_record.time_out=datetime.now(manila_tz).replace(second=0,microsecond=0)
            existing_attendance_record.status="attended"
            existing_attendance_record.fines=0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time Out successfully ✅'})
            

        return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
#----------completed event-------------------------------
#get the schedules years
@manage_attendance.route('/get_event_years', methods=['GET'])
def get_event_years():
    try:
        schedule = Schedule.query.all()
        years = sorted({s.scheduled_date.year for s in schedule}, reverse=True)
        return jsonify({"years": years})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#get completed events
@manage_attendance.route('/completed_events_list_data', methods=['GET'])
def completed_events_list_data():
    try:
        year_filter = request.args.get('year', type=int)
        sort_by = request.args.get('sort_by', default='date', type=str)  # Default sort by date
        order = request.args.get('order', default='desc', type=str)  # Default to descending order
        print(f"Received year filter: {year_filter}, sort_by: {sort_by}, order: {order}")  # Debugging line
        
        events_data = []
        # Fetch completed events based on the year filter
        if year_filter:
            completed_events = Schedule.query.filter(
                extract('year', Schedule.scheduled_date) == year_filter,
                Schedule.is_ended == True,
                Schedule.status == 'ended'
            )
            
            # Sorting based on 'sort_by' and 'order'
            if sort_by == 'name':
                if order == 'asc':
                    completed_events = completed_events.order_by(Schedule.name.asc())
                else:
                    completed_events = completed_events.order_by(Schedule.name.desc())
            
            completed_events = completed_events.all()
            
            for event in completed_events:
                events = {
                    "id": event.id,
                    "name": event.name,
                    "scheduled_date": event.scheduled_date.strftime('%Y-%B-%d-%A'),
                }
                events_data.append(events)

        return jsonify({'data': events_data})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#get completed activitites
@manage_attendance.route('/completed_activities_list_data', methods=['GET'])
def completed_activities_list_data():
    try:
        # For GET request, use request.args
        event_id = request.args.get('event_id',[])

        if not event_id:
            return jsonify({'success': False, 'message': 'No event ID provided'})

        # Convert event_id to integer if needed
        try:
            event_id = int(event_id)
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid event ID format'})

        # Fetch completed activities
        completed_activities = Sched_activities.query.filter(
            Sched_activities.is_ended == True,
            Sched_activities.schedule_id == event_id
        ).all()

        if not completed_activities:
            return jsonify({'success': False, 'message': 'No activities found'})

        activities_data = [
            {
                "id": activity.id,
                "name": activity.name,
                "start_time": activity.start_time.strftime('%I:%M %p'),
                "end_time": activity.end_time.strftime('%I:%M %p'),
                "event_name":activity.schedule.name,
                "event_date":activity.schedule.scheduled_date.strftime('%Y-%B-%d-%A')
            }
            for activity in completed_activities
        ]

        return jsonify({'success': True, 'data': activities_data})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})



# Get completed attendance data
@manage_attendance.route('/completed_attendances_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def completed_attendances_data():
    try:

        # Get filter values from request
        selected_activity = request.args.get('activity', '').strip()
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()
        selected_status = request.args.get('status', '').strip()
        
        # 🛑 Stop if no activity is selected
        if not selected_activity:
            return jsonify({'data': []})

        # Base query
        query = db.session.query(Attendance).join(User).join(Sched_activities).join(Department)

        # Filter by activity if provided
        if selected_activity:
            query = query.filter(
                Sched_activities.id == selected_activity,
                                 )
            
        # Apply dynamic filters
        if selected_status:
            query = query.filter(Attendance.status == selected_status)
        # Apply dynamic filters
        if selected_course:
            query = query.filter(Department.name == selected_course)
        if selected_year:
            query = query.filter(Department.year == selected_year)
        if selected_section:
            query = query.filter(Department.section == selected_section)

        # Fetch results
        attendance = query.all()
        all_attendance = []

        for a in attendance:
            schedule_data = {
                'id': a.id,
                'student_name': f"{a.user.first_name} {a.user.last_name}",
                'time_in': f"✅{a.time_in.strftime('%I:%M %p')}" if a.time_in else "❌",
                'time_out': f"✅{a.time_out.strftime('%I:%M %p')}" if a.time_out else "❌",
                'department': a.user.department.name,
                'year': a.user.department.year,
                'section': a.user.department.section,
                'status':a.status
            }
            all_attendance.append(schedule_data)

        return jsonify({'data': all_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#update_attendance_status
@manage_attendance.route('/update_attendance_status', methods=['PUT'])
@login_required
@role_required_multiple('admin','ssg')
def update_attendance_status():
    try:
       
        status = request.form.get('update_status')
        attendance_id = request.form.get('attendance_id')


        if not status:
            return jsonify({'success': False, 'message': 'status not provided'})
        
        if not attendance_id:
            return jsonify({'success': False, 'message': 'sttendance ID not provided'})

        valid_status=["attended","absent","missed_out"]
        
        if status not in valid_status:
            return jsonify({'success': False, 'message': 'Invalid Status'})
        
        selected_attendance=Attendance.query.get(attendance_id)
        
        if not selected_attendance:
            return jsonify({'success': False, 'message': 'Attendance not found'})
        
        if status=="attended":
            selected_attendance.time_in=selected_attendance.sched_activities.start_time
            selected_attendance.time_out=selected_attendance.sched_activities.end_time
            selected_attendance.fines=0
            
        if status=="absent":
            selected_attendance.time_in=None
            selected_attendance.time_out=None
            selected_attendance.fines=selected_attendance.sched_activities.fines
            
        if status=="missed_out":
            selected_attendance.time_in=selected_attendance.sched_activities.start_time
            selected_attendance.time_out=None
            selected_attendance.fines=(selected_attendance.sched_activities.fines/2) if selected_attendance.sched_activities.fines else 0

 
        selected_attendance.status=status
        db.session.commit()

        return jsonify({'success': True, 'message': 'Attendance status updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Delete completed attendance (api)
@manage_attendance.route('/delete_completed_attendance', methods=['DELETE'])
@login_required
@role_required_multiple('admin','ssg')
def delete_completed_attendance():
    try:
       
        # Fetch the event by ID and delete it
        attendance_id = request.json.get('attendance_id', [])
        
        if not attendance_id:
            return jsonify({'success': False, 'message': 'No attendance IDprovided'})
        
        attendance_to_delete = Attendance.query.get(attendance_id)
        
        if not attendance_to_delete:
            return jsonify({'success': False, 'message': 'attendance not found'})
        
        db.session.delete(attendance_to_delete)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Attendance record deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Delete selected completed attendance (API)
@manage_attendance.route('/delete_selected_completed_attendance', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_completed_attendance():
    try:
        
        attendance_ids = request.json.get('attendance_ids', [])
        
        if not attendance_ids:
            return jsonify({'success': False, 'message': 'No Attendance IDs provided'})

        attendance_to_delete = Attendance.query.filter(Attendance.id.in_(attendance_ids)).all()
        
        if not attendance_to_delete:
            return jsonify({'success': False, 'message': 'No attendance found for the provided IDs'})

        for attendance in attendance_to_delete:
            db.session.delete(attendance)  # Delete each 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(attendance_to_delete)} atttendances deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#add attendeess IN completed
@manage_attendance.route('/add_student_in_completed', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_in_completed():
    try:
        
        student_id = request.json.get('student_id',[])
        activity_id = request.json.get('activity_id',[])
        

        if not student_id:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.id==student_id,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student_id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name} already Time In ❌'})
            
            existing_attendance_record.time_in=activity.start_time
            existing_attendance_record.status="missed_out"
            existing_attendance_record.fines = (activity.fines / 2) if activity.fines else 0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})
            

        # Create a new attendance record
        attendeeAdd = Attendance(
            sched_activities_id=activity_id, 
            student_id=student_id,  # Ensure the column matches your model
            time_in=activity.start_time , # Set the correct time zone
            status="missed_out",
            fines=activity.fines/2 if activity.fines else 0
        )
        db.session.add(attendeeAdd)
        db.session.commit()

        return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time In successfully ✅'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#add attendeess OUT completed
@manage_attendance.route('/add_student_out_completed', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_out_completed():
    try:
        
        student_id = request.json.get('student_id',[])
        activity_id = request.json.get('activity_id',[])

        if not student_id:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.id==student_id,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student_id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if not existing_attendance_record.time_in:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})
            
            if existing_attendance_record.time_out:
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Already Time Out❌'})
            
            existing_attendance_record.time_out=activity.end_time
            existing_attendance_record.status="attended"
            existing_attendance_record.fines=0
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Time Out successfully ✅'})
            

        return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name}, Please Time In first ❌'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
    
    
   
#add attendeess absent completed
@manage_attendance.route('/add_student_absent_completed', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_student_absent_completed():
    try:
        
        student_id = request.json.get('student_id',[])
        activity_id = request.json.get('activity_id',[])
        

        if not student_id:
            return jsonify({'success': False, 'message': 'Student ID not provided ❌'})
        if not activity_id:
            return jsonify({'success': False, 'message': 'Activity ID not provided ❌'})
        
        student=User.query.filter(
            User.id==student_id,
            User.role=="student",
            User.is_verified==True,
            User.is_deactivated==False
            ).first()
        
        if not student:
             return jsonify({'success': False, 'message': 'Student Not Found ❌'})
            

        activity=Sched_activities.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': f'No events and activity selected ❌'})

        existing_attendance_record = Attendance.query.filter_by(
            student_id=student_id,
            sched_activities_id=activity_id  # <-- Add this
        ).first()

        if existing_attendance_record:
            
            if existing_attendance_record.status=="absent":
                return jsonify({'success': False, 'message': f'{student.first_name} {student.last_name} already Marked as absent❌'})
                
    
            existing_attendance_record.time_in=None
            existing_attendance_record.time_out=None
            existing_attendance_record.status="absent"
            existing_attendance_record.fines = activity.fines
            db.session.commit()
            return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Marked as absent ✅'})
            

        # Create a new attendance record
        absentAdd = Attendance(
            sched_activities_id=activity_id, 
            student_id=student_id,  # Ensure the column matches your model
            time_in=None , # Set the correct time zone
            time_out=None , # Set the correct time zone
            status="absent",
            fines=activity.fines
        )
        db.session.add(absentAdd)
        db.session.commit()

        return jsonify({'success': True, 'message': f'{student.first_name} {student.last_name} Marked as absent ✅'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
