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

#import random
import re
from pytz import timezone
from datetime import datetime,time
manila_tz = timezone('Asia/Manila')
from website import db
from sqlalchemy.sql import func

#from werkzeug.security import generate_password_hash,check_password_hash
from website.security.user_regulator import redirect_user_based_on_role
from website.smtp_mailer import send_verification_email,get_serializer


from website.models.database_models import User,Department





'''
#signup
# Function to generate a unique 6-digit Student ID
def generate_student_id():
    while True:
        random_id = str(random.randint(100000, 999999))  # Generates exactly 6 digits
        if not User.query.filter_by(student_ID=random_id).first():  # Ensures uniqueness
            return random_id
'''

#create blueprint/routes
signup = Blueprint('signup', __name__)


# User Signup Route
@signup.route('/signup_page', methods=['POST', 'GET'])
def signup_page():
    
    if current_user.is_authenticated:
        return redirect_user_based_on_role(current_user.role)
    
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

    if request.method == 'POST':
        
        try:
            student_ID = request.form.get('student_id')
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
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
            if not confirm_password:
                return jsonify({'success': False, 'message': 'Please confirm your password'})
            
            if not department or not year or not section:
                return jsonify({'success': False, 'message': 'Deparment, year and section cannot be empty'})
            
            
            if not (6 <= len(password) <= 20):
                return jsonify({'success': False, 'message': 'Password must between 6 to 20 characters'})
            
            # Password strength check
            password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,20}$'
            if not re.match(password_pattern, password):
                return jsonify({'success': False, 'message': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.'})
                        
            if password != confirm_password:
                return jsonify({'success': False, 'message': 'Password not match'})
                
            
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
            

            # Create new user
            new_user = User(
                student_ID=student_ID,
                first_name=first_name,
                last_name=last_name,
                email=email,
                password=password,  # Store hashed password
                date_registered=datetime.now(manila_tz).replace(second=0, microsecond=0),
                department_id=selected_department.id,
                is_verified=False
            )

            # Save to database
            db.session.add(new_user)
            db.session.commit()

           # Generate verification token
            serializer = get_serializer()
            token = serializer.dumps(email, salt='email-confirm')
            confirm_url = url_for('verify_email.confirm_email', token=token, _external=True)

            # Send verification email
            send_verification_email(email, confirm_url)

            return jsonify({
                'success': True,
                'message': 'Signup successful! Please check your email inbox or spam to verify your account.',
                'redirect_url': url_for('login.login_page')
            })

        except Exception as e:
            db.session.rollback()  # Rollback if there's an error
            return jsonify({'success': False, 'message': str(e)})

    return render_template('auth/signup_page.jinja2',
                           course=course,
                           year=year,
                           section=section 
                           )