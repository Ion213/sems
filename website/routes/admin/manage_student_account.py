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

from website.security.user_regulator import role_required

from werkzeug.security import generate_password_hash

from pytz import timezone
manila_tz = timezone('Asia/Manila')
from datetime import datetime,timedelta
from datetime import timezone as tz
from sqlalchemy import or_,and_,extract
from sqlalchemy.sql import func
import random
import re

from website import db
from website.models.database_models import Department,User,Attendance

manage_student_account = Blueprint('manage_student_account', __name__)
'''
#generate student id
@manage_student_account.route('/generate_student_id', methods=['GET'])
#@login_required
#@role_required('admin')
def generate_student_id():
    while True:
        random_id = str(random.randint(100000, 999999))  # Generates exactly 6 digits
        if not User.query.filter_by(student_ID=random_id).first():  # Ensures uniqueness
            return jsonify({'random_id': random_id})
'''

#render student account html
@manage_student_account.route('/manage_student_account_page', methods=['GET'])
@login_required
@role_required('admin')
def manage_student_account_page():
    departments=Department.query.all()
    
    # Use sets to store unique values
    course_set = set()
    year_set = set()
    section_set = set()

    for d in departments:
        course_set.add(d.name)
        year_set.add(d.year)
        section_set.add(d.section)

    # Convert sets back to lists
    course = list(course_set)
    year = list(year_set)
    section = list(section_set)
    
    return render_template('admin/manage_student_account.jinja2',
                           course=course,
                           year=year,
                           section=section      
                    )
    

#get student data
@manage_student_account.route('/student_account_data', methods=['GET'])
@login_required
@role_required('admin')
def student_account_data():
    try:
        
        now_utc = datetime.now(tz.utc).replace(second=0, microsecond=0)
        online_threshold = now_utc - timedelta(minutes=5)
        
        # Get filter values from request
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()

        # Query students and join with Department
        query = db.session.query(User).join(Department).filter(
            User.role == 'student',
            User.is_verified == True,
            User.is_deactivated==False
        )

        # Apply filters dynamically
        if selected_course:
            query = query.filter(
                Department.name == selected_course)
            
        if selected_year:
            query = query.filter(
                Department.year == selected_year)
        if selected_section:
            query = query.filter(Department.section == selected_section)

        # Execute query
        students = query.all()
        all_students = []
        
        for st in students:
            
            if st.last_seen:
                last_seen_utc = st.last_seen.astimezone(tz.utc).replace(second=0, microsecond=0)
                is_online = last_seen_utc >= online_threshold
            else:
                is_online = False
            
            students_data = {
                'id': st.id,
                'student_ID':st.student_ID,
                'first_name':st.first_name,
                'last_name':st.last_name,
                'email':st.email,
                'password':st.password,
                'hide_password':('*'* len(st.password)),
                'department':st.department.name,
                'year':st.department.year,
                'section':st.department.section,
                'date_registered':st.date_registered.strftime('%Y-%B-%d-%A %I:%M %p') if st.date_registered else None,
                #'date_updated':st.date_updated.strftime('%Y-%B-%d-%A %I:%M %p') if st.date_updated else None,
                'status':'online🟢' if is_online else 'offline🔴',

            }
            
            all_students.append(students_data)
        return jsonify({'data': all_students})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#add student account
@manage_student_account.route('/add_student_account', methods=['POST'])
@login_required
@role_required('admin')
def add_student_account():
    try:

        student_ID = request.form.get('student_id')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        department = request.form.get('course')
        year = request.form.get('year')
        section = request.form.get('section')


        if not student_ID:
            return jsonify({'success': False, 'message': 'Student ID cannot be empty'})
        if len(str(student_ID)) != 11:
            return jsonify({'success': False, 'message': 'Student ID must be 11 digits'})
        if not first_name:
            return jsonify({'success': False, 'message': 'Student first name cannot be empty'})
        if not last_name:
            return jsonify({'success': False, 'message': 'student last name cannot be empty'})
        if not email:
            return jsonify({'success': False, 'message': 'student email cannot be empty'})
        if not password:
            return jsonify({'success': False, 'message': 'Student password cannot be empty'})
        if not department or not year or not section:
            return jsonify({'success': False, 'message': 'Deparment, year and section cannot be empty'})
        
        if not (6 <= len(password) <= 20):
            return jsonify({'success': False, 'message': 'Password must between 6 to 20 characters'})
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
                return jsonify({'success': False, 'message': 'Invalid email format.'})
            
        selected_department = Department.query.filter(
            Department.name == department,
            Department.year == year,
            Department.section == section
        ).first()  # ✅ Fetch the first matching department
        
        if not selected_department:
            return jsonify({'success': False, 'message': 'Selected Department not found'})
        
        #hashed_password = generate_password_hash(passwordV, method='pbkdf2:sha512')

        existing_student_ID = User.query.filter_by(
            student_ID=student_ID
            ).first()
        existing_student_name = User.query.filter(
            func.lower(User.first_name)==func.lower(first_name),
            func.lower(User.last_name)==func.lower(last_name)
            ).first()
        existing_student_email= User.query.filter_by(
            email=email
            ).first()
        
        if existing_student_ID:
            return jsonify({'success': False, 'message': 'Student ID already used'})
        if existing_student_name:
            return jsonify({'success': False, 'message': 'Student already exists'})
        if existing_student_email:
            return jsonify({'success': False, 'message': 'Student email already used'})


        studentAdd = User(
            student_ID=student_ID,
            first_name=first_name, 
            last_name=last_name,
            email=email,
            password=password,
            department_id=selected_department.id,
            date_registered=datetime.now(manila_tz).replace(second=0,microsecond=0),
            is_verified=True
            )
        db.session.add(studentAdd)
        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#delete student account
@manage_student_account.route('/delete_student_account', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_student_account():
    try:
        
        # Fetch the event by ID and delete it
        student_id = request.json.get('student_id', [])
        
        if not student_id:
            return jsonify({'success': False, 'message': 'No student id provided'})

        # Fetch the event by ID and delete it
        studentDel = User.query.get(student_id)
        
        if not studentDel:
            return jsonify({'success': False, 'message': 'Student not found'})

        db.session.delete(studentDel)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student Account deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
# Delete selected students account (API)
@manage_student_account.route('/delete_selected_students_account', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_selected_students_account():
    try:
        # Get the list of students IDs from the request
        student_ids = request.json.get('student_ids', [])
        
        if not student_ids:
            return jsonify({'success': False, 'message': 'No not students IDs provided'})

        # Fetch all the students and delete them
        students_to_delete = User.query.filter(
            User.id.in_(student_ids)
            ).all()
        
        if not students_to_delete:
            return jsonify({'success': False, 'message': 'No students found for the provided IDs'})

        for student in students_to_delete:
            db.session.delete(student)  # Delete each events 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(students_to_delete)} students deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
    
#update student account
@manage_student_account.route('/update_student_account', methods=['PUT'])
@login_required
@role_required('admin')
def update_student_account():
    try:

        selected_student_account_id = request.form.get('selected_student_account_id')
        update_student_ID = request.form.get('update_student_id')
        update_first_name = request.form.get('update_first_name')
        update_last_name = request.form.get('update_last_name')
        update_email = request.form.get('update_email')
        update_password = request.form.get('update_password')
        
        update_department = request.form.get('update_course')
        update_year = request.form.get('update_year')
        update_section = request.form.get('update_section')
        
        if not selected_student_account_id:
            return jsonify({'success': False, 'message': 'Student account id provided'})
        
        if not update_student_ID:
            return jsonify({'success': False, 'message': 'Student ID cannot be empty'})
        
        if len(str(update_student_ID)) != 11:
            return jsonify({'success': False, 'message': 'Student ID must be 11 digits'})
        
        if not update_first_name:
            return jsonify({'success': False, 'message': 'Student first name cannot be empty'})
        if not update_last_name:
            return jsonify({'success': False, 'message': 'student last name cannot be empty'})
        if not update_email:
            return jsonify({'success': False, 'message': 'student email cannot be empty'})
        if not update_password:
            return jsonify({'success': False, 'message': 'Student password cannot be empty'})
        if not update_department or not update_year or not update_section:
            return jsonify({'success': False, 'message': 'Deparment, year and section cannot be empty'})
        
        if not (6 <= len(update_password) <= 20):
            return jsonify({'success': False, 'message': 'Password must between 6 to 20 characters'})
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, update_email):
                return jsonify({'success': False, 'message': 'Invalid email format.'})
    
        selected_department = Department.query.filter(
                    Department.name == update_department,
                    Department.year == update_year,
                    Department.section == update_section
                ).first()  # ✅ Fetch the first matching department
        
        if not selected_department:
            return jsonify({'success': False, 'message': 'Selected Department not found'})
        
        #hashed_password = generate_password_hash(update_passwordV, method='pbkdf2:sha512')

        existing_student_name = User.query.filter(
            User.id != selected_student_account_id,
            func.lower(User.first_name) == func.lower(update_first_name),
            func.lower(User.last_name)==func.lower(update_last_name)
            ).first()
        
        existing_student_email = User.query.filter(
            User.id != selected_student_account_id,
            User.email==update_email,
            ).first()
        
        if existing_student_name:
            return jsonify({'success': False, 'message': 'Student already exist'})
        
        if existing_student_email:
            return jsonify({'success': False, 'message': 'email already used'})

        # Update the event
        studentUp = User.query.get(selected_student_account_id)
        studentUp.student_ID=update_student_ID
        studentUp.first_name=update_first_name
        studentUp.last_name=update_last_name
        studentUp.email=update_email
        studentUp.password=update_password
        studentUp.department_id=selected_department.id
        studentUp.date_updated=datetime.now(manila_tz).replace(microsecond=0,second=0)
        studentUp.is_verified=True
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student account updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
    
    
    
    
    
    
#-----------------------------------------------------------------

#get unverified students accounts
@manage_student_account.route('/unverified_student_account_data', methods=['GET'])
@login_required
@role_required('admin')
def unverified_student_account_data():
    try:
            # Get filter values from request
            selected_course = request.args.get('course', '').strip()
            selected_year = request.args.get('year', '').strip()
            selected_section = request.args.get('section', '').strip()

            # Query students and join with Department
            query = db.session.query(User).join(Department).filter(
                User.role == 'student',
                User.is_verified == False,
                User.is_deactivated==False
            )

            # Apply filters dynamically
            if selected_course:
                query = query.filter(
                    Department.name == selected_course)
                
            if selected_year:
                query = query.filter(
                    Department.year == selected_year)
            if selected_section:
                query = query.filter(Department.section == selected_section)

            # Execute query
            students = query.all()
            all_students = []
            
            for st in students:
                students_data = {
                    'id': st.id,
                    'student_ID':st.student_ID,
                    'first_name':st.first_name,
                    'last_name':st.last_name,
                    'email':st.email,
                    'password':st.password,
                    'hide_password':('*'* len(st.password)),
                    'department':st.department.name,
                    'year':st.department.year,
                    'section':st.department.section,
                    'date_registered':st.date_registered.strftime('%Y-%B-%d-%A %I:%M %p') if st.date_registered else None,

                }
                
                all_students.append(students_data)
            return jsonify({'data': all_students})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
    
#accept or verify student account
@manage_student_account.route('/verify_student_account', methods=['PUT'])
@login_required
@role_required('admin')
def verify_student_account():
    try:

        # Get the list of students IDs from the request
        student_id = request.json.get('student_id', [])
        
        if not student_id:
            return jsonify({'success': False, 'message': 'No students IDs provided'})


        studentAccept = User.query.get(student_id)

        if not studentAccept:
            return jsonify({'success': False, 'message': 'Student not found'})
        

        studentAccept.is_verified=True
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student Account Verified successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#accept or verify selected students account
@manage_student_account.route('/verify_selected_students_account', methods=['PUT'])
@login_required
@role_required('admin')
def verify_selected_students_account():
    try:

        # Get the list of students IDs from the request
        student_ids = request.json.get('student_ids', [])
        
        if not student_ids:
            return jsonify({'success': False, 'message': 'No students IDs provided'})
        
        
        students_to_accept= User.query.filter(
            User.id.in_(student_ids)
            ).all()
        
        if not students_to_accept:
            return jsonify({'success': False, 'message': 'No students found for the provided IDs'})

        for student in students_to_accept:
            student.is_verified = True
            
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(students_to_accept)} Students Account Verified successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#decline student account
@manage_student_account.route('/decline_student_account', methods=['DELETE'])
@login_required
@role_required('admin')
def decline_student_account():
    try:
        # Get the list of students IDs from the request
        student_id = request.json.get('student_id', [])
        
        if not student_id:
            return jsonify({'success': False, 'message': 'No students IDs provided'})
        
        # Fetch the event by ID and delete it
        studentDel = User.query.get(student_id)
        if not studentDel:
            return jsonify({'success': False, 'message': 'Student not found'})

        db.session.delete(studentDel)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student Account Rejected Successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    

#reject or decline select students account
@manage_student_account.route('/decline_selected_students_account', methods=['DELETE'])
@login_required
@role_required('admin')
def decline_selected_students_account():
    try:

        # Get the list of students IDs from the request
        student_ids = request.json.get('student_ids', [])
        
        if not student_ids:
            return jsonify({'success': False, 'message': 'No students IDs provided'})
        
        
        students_to_reject= User.query.filter(
            User.id.in_(student_ids)
            ).all()
        
        if not students_to_reject:
            return jsonify({'success': False, 'message': 'No students found for the provided IDs'})

        for student in students_to_reject:
            db.session.delete(student)
            
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(students_to_reject)} Students Account Rejected successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})