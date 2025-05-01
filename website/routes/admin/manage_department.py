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

from pytz import timezone
manila_tz = timezone('Asia/Manila')
from datetime import datetime
from sqlalchemy import or_,and_,extract
from sqlalchemy.sql import func

from website import db
from website.models.database_models import Department,User

manage_department = Blueprint('manage_department', __name__)

#render department html
@manage_department.route('/manage_department_page', methods=['GET'])
@login_required
@role_required('admin')
def manage_department_page():
    years=["1st Year","2nd Year","3rd Year","4th Year",]
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
    
    return render_template('admin/manage_department.jinja2',
        years=years,
        course=course,
        year=year,
        section=section
        )


#get department data
@manage_department.route('/department_data', methods=['GET'])
@login_required
@role_required('admin')
def department_data():
    try:
        
        # Get filter values from the request
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()
        # Start query
        query = Department.query
        # Apply filters only if values are provided
        if selected_course:
            query = query.filter(Department.name == selected_course)
        if selected_year:
            query = query.filter(Department.year == selected_year)
        if selected_section:
            query = query.filter(Department.section == selected_section)
            
        departments = query.all()
            
            
        #departments = Department.query.all()
        all_departments = []
        for d in departments:
            department_data = {
                'id': d.id,
                'name': d.name,
                'year': d.year,
                'section': d.section
            }
            all_departments.append(department_data)

        return jsonify({'data': all_departments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
    
#add department
@manage_department.route('/add_department', methods=['POST'])
@login_required
@role_required('admin')
def add_department():
    try:

        department_name = request.form.get('department_name')
        year = request.form.get('year')
        section = request.form.get('section')

        if not department_name:
            return jsonify({'success': False, 'message': 'Department Name cannot be Empty'})
        if not year:
            return jsonify({'success': False, 'message': 'Department Year cannot be Empty'})
        if not section:
            return jsonify({'success': False, 'message': 'Department Section cannot be Empty'})

        existing_department = Department.query.filter_by(
            name=department_name,
            year=year,
            section=section
            ).first()
        if existing_department:
            return jsonify({'success': False, 'message': 'Department already exist'})
        
        departmentAdd = Department(
            name=department_name, 
            year=year,
            section=section
            )
        db.session.add(departmentAdd)
        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
#delete department  
@manage_department.route('/delete_department', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_department():
    try:
        
        # Fetch the event by ID and delete it
        department_id = request.json.get('department_id', [])
        
        print(department_id)
        
        if not department_id:
            return jsonify({'success': False, 'message': 'No department IDs provided'})
        
        # Fetch the event by ID and delete it
        departmentDel = Department.query.get(department_id)
        if not departmentDel:
            return jsonify({'success': False, 'message': 'Department not found'})

        db.session.delete(departmentDel)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Department deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Delete selected departments (API)
@manage_department.route('/delete_selected_departments', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_selected_departments():
    try:
        # Get the list of departments IDs from the request
        department_ids = request.json.get('department_ids', [])
        
        if not department_ids:
            return jsonify({'success': False, 'message': 'No departments IDs provided'})

        # Fetch all the departments and delete them
        departments_to_delete = Department.query.filter(
            Department.id.in_(department_ids)
            ).all()
        
        if not departments_to_delete:
            return jsonify({'success': False, 'message': 'No department found for the provided IDs'})

        for department in departments_to_delete:
            db.session.delete(department)  # Delete each events 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(departments_to_delete)} departments deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#update department
@manage_department.route('/update_department', methods=['PUT'])
@login_required
@role_required('admin')
def update_department():
    try:
        update_selected_department_id = request.form.get('update_selected_department_id')
        update_department_name = request.form.get('update_department_name')
        update_department_year = request.form.get('update_year')
        update_department_section = request.form.get('update_section')

        if not update_selected_department_id:
            return jsonify({'success': False, 'message': 'Department ID not provided'})


        if not update_department_name:
            return jsonify({'success': False, 'message': 'Department name cannot be empty'})

        if not update_department_year:
            return jsonify({'success': False, 'message': 'Department Year cannot be empty'})
        
        if not update_department_section:
            return jsonify({'success': False, 'message': 'Department Section cannot be empty'})


        existing_department = Department.query.filter(
            Department.id != update_selected_department_id, 
            Department.name ==update_department_name,
            Department.year==update_department_year,
            Department.section==update_department_section
            ).first()
        
        if existing_department:
            return jsonify({'success': False, 'message': 'Department already exist'})

        departmentUp = Department.query.get(update_selected_department_id)
        departmentUp.name = update_department_name
        departmentUp.year = update_department_year
        departmentUp.section = update_department_section
        db.session.commit()

        return jsonify({'success': True, 'message': 'Department updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})