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

from werkzeug.security import generate_password_hash

from pytz import timezone
manila_tz = timezone('Asia/Manila')
from datetime import datetime
from sqlalchemy import or_,and_,extract
from sqlalchemy.sql import func
import random
import re
import traceback
import string
from sqlalchemy import asc, desc

from website import db
from website.models.database_models import Department,User,Attendance,Payment,Schedule,Sched_activities

import uuid




manage_payment = Blueprint('manage_payment', __name__)

#render payments html
@manage_payment.route('/manage_payment_page', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def manage_payment_page():
    
    
    departments=Department.query.all()
    users = User.query.filter(
        User.is_deactivated==False,
        User.role=="student",
        User.is_verified==True
        ).all()
    
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
    
    # Fetch all events to extract years
    payment = Payment.query.all()
    years = {p.transaction_date.year for p in payment}  # Get unique years from event data
    
    schedule_years=Schedule.query.all()
    sched_years={y.scheduled_date.year for y in schedule_years}

    # Get the most recent year
    most_recent_year = max(years) if years else None
    
   
    return render_template('admin/manage_payment.jinja2',
                           date_years=sorted(years, reverse=True), 
                           most_recent_year=most_recent_year,
                           course=course,
                           year=year,
                           section=section ,
                           users=users,
                           sched_years=sched_years
                           )
    
    
#get transaction record
@manage_payment.route('/transaction_history_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def transaction_history_data():
    try:
        selected_date_year = request.args.get('date_year', '').strip()
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()

        # Start the query with Payment
        query = db.session.query(Payment).join(User)

        if selected_date_year.isdigit():
            query = query.filter(extract('year', Payment.transaction_date) == int(selected_date_year))

        if selected_course:
            query = query.filter(User.department.has(name=selected_course))
        if selected_year:
            query = query.filter(User.department.has(year=selected_year))
        if selected_section:
            query = query.filter(User.department.has(section=selected_section))

        query = query.order_by(Payment.transaction_date.desc())
        payments = query.all()

        all_payments = []
        for p in payments:
            user = p.user
            dept = user.department if user else None

            payments_data = {
                "id": p.id,
                "transaction_code": p.transaction_code,
                "name": f'{user.first_name or ""} {user.last_name or ""}' if user else "Unknown",
                "department": dept.name if dept else "N/A",
                "year": dept.year if dept else "N/A",
                "section": dept.section if dept else "N/A",
                #"total_fines": p.total_fines,
                #"cash_amount": p.cash_amount,
                #"amount_paid": p.amount_paid,
                #"change": p.change,
                #"note": p.notes,
                "date": p.transaction_date.strftime('%Y-%B-%d-%A %I:%M %p')
            }
            all_payments.append(payments_data)

        return jsonify({'data': all_payments})

    except Exception as e:
        return jsonify({'data': [], 'error': str(e)})

    
     
#get attendance fines
@manage_payment.route('/get_student_unpaid_attendance_fines', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_student_unpaid_attendance_fines():
    try:
        user_id = request.args.get('user_id', '').strip()

        # Get unpaid and absent/missed_out attendance records
        unpaid_attendance = db.session.query(Attendance).join(Sched_activities).join(Schedule).filter(
            Attendance.student_id == user_id,
            Attendance.is_paid == False,
            Attendance.fines!=0,
            Schedule.is_ended==True,
            Attendance.status.in_(["absent", "missed_out"])
        ).all()

        all_unpaid_attendance_fines = []

        for att in unpaid_attendance:
            attendance_fines = {
                "id": att.id,
                "fines": att.fines,
                "status": att.status,
                "activity_name": att.sched_activities.name if att.sched_activities else "N/A",
                "schedule_name":  att.sched_activities.schedule.name if att.sched_activities.schedule else "N/A"
            }
            all_unpaid_attendance_fines.append(attendance_fines)

        return jsonify({'data': all_unpaid_attendance_fines})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#generate transaction code
def generate_transaction_code():
    existing_codes = {payment.transaction_code for payment in Payment.query.with_entities(Payment.transaction_code).all()}
    while True:
        code = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        if code not in existing_codes:
            return code    

#add payment
@manage_payment.route('/add_payment', methods=['POST'])
@login_required
@role_required_multiple('admin', 'ssg')
def add_payment():
    try:
        
        student_id = request.form.get('selected_student')
        attendance_ids = request.form.getlist('attendance_ids')
        
        cash_amount = float(request.form.get('cash_amount', 0))
        notes = request.form.get('notes', '')

        if not student_id or not attendance_ids:
            return jsonify({'success': False, 'message': 'Student and attendances must be selected.'})
        
        if cash_amount == 0:
            return jsonify({'success': False, 'message': 'Please provide a cash given amount'})
            
        selected_attendance = Attendance.query.filter(
            Attendance.id.in_(attendance_ids)
        ).all()
        
        if not selected_attendance:
            return jsonify({'success': False, 'message': 'Selected attendance not found'})
        
        # Calculate total fines
        total_fines = sum(attendance.fines for attendance in selected_attendance)
        
        if cash_amount < total_fines:
            return jsonify({'success': False, 'message': 'Cash given amount must be greater than or equal to total fines'})
        
        # Calculate payment change
        payment_change = cash_amount - total_fines
        
        # Create a new payment record
        new_payment = Payment(
            transaction_code=generate_transaction_code(),
            transaction_date=datetime.now(manila_tz).replace(second=0, microsecond=0),
            total_fines=total_fines,
            cash_amount=cash_amount,
            amount_paid=total_fines,  # The amount paid is equal to the total fines
            change=payment_change,
            notes=notes,
            student_id=student_id,
            payment_method="manual"
        )
        
        db.session.add(new_payment)
        db.session.flush()
        
        # Mark selected attendances as paid
        for attendance in selected_attendance:
            attendance.is_paid = True
            attendance.payment_id=new_payment.id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment recorded successfully!',
            'transaction_id': new_payment.id  # or use transaction_code if you prefer
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
#get receipt data after paying 
@manage_payment.route('/get_receipt/<int:payment_id>', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_receipt(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    user = payment.user
    department = user.department if user else None

    receipt_data = {
        'transaction_code': payment.transaction_code,
        'student_name': f'{user.first_name} {user.last_name}' if user else 'Unknown',
        'department': department.name if department else 'N/A',
        'year': department.year if department else 'N/A',
        'section': department.section if department else 'N/A',
        'total_fines': f'{payment.total_fines:.2f}',
        'cash_amount': f'{payment.cash_amount:.2f}',
        'amount_paid': f'{payment.amount_paid:.2f}',
        'change': f'{payment.change:.2f}',
        'note': payment.notes,
        'date': payment.transaction_date.strftime('%Y-%B-%d %I:%M %p')
    }

    return jsonify({'success': True, 'receipt': receipt_data})

#delete transaction
@manage_payment.route('/delete_transaction', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_transaction():
    try:
        
        transaction_id = request.json.get('transaction_id')
        
        if not transaction_id:
            return jsonify({'success': False, 'message': 'No transaction ID provided'})

        transaction_to_delete = Payment.query.get(transaction_id)
        
        if not transaction_to_delete:
            return jsonify({'success': False, 'message': 'Payment transaction not found'})

        # Undo attendance payment if relationship exists
        attendance_to_undo_payment = Attendance.query.filter_by(payment_id=transaction_id).all()
        
        for attendance in attendance_to_undo_payment:
            attendance.is_paid = False
            attendance.payment_id = None  # optional, if you track this

        db.session.delete(transaction_to_delete)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Payment transaction deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    

# Delete selected transactions (API)
@manage_payment.route('/delete_selected_transactions', methods=['DELETE'])
@login_required
@role_required_multiple('admin', 'ssg')
def delete_selected_transactions():
    try:
       
        transaction_ids = request.json.get('transaction_ids', [])
        
        if not transaction_ids:
            return jsonify({'success': False, 'message': 'No Transaction IDs provided'})

        # Fetch payment records
        transactions_to_delete = Payment.query.filter(Payment.id.in_(transaction_ids)).all()
        
        if not transactions_to_delete:
            return jsonify({'success': False, 'message': 'No transactions found for the provided IDs'})

        # Undo payment references in Attendance
        attendances_to_undo = Attendance.query.filter(
            Attendance.payment_id.in_(transaction_ids)
        ).all()

        for attendance in attendances_to_undo:
            attendance.is_paid = False
            attendance.payment_id = None

        # Delete payments
        for payment in transactions_to_delete:
            db.session.delete(payment)

        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(transactions_to_delete)} transaction(s) deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
# Get paid attendance data
@manage_payment.route('/get_paid_attendance_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_paid_attendance_data():
    try:
        transaction_id = request.args.get('transaction_id', '')

        if not transaction_id:
            return jsonify({'success': False, 'message': 'Transaction ID is required.'})

        try:
            transaction_id = int(transaction_id)
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid transaction ID.'})

        paid_attendance = db.session.query(Attendance).join(Payment).filter(
            Attendance.is_paid == True,
            Payment.id == transaction_id
        ).all()
        
        all_paid_attendance = []

        for paid in paid_attendance:
            schedule_data = {
                'event_name': paid.sched_activities.schedule.name,
                'event_date': paid.sched_activities.schedule.scheduled_date.strftime('%Y-%B-%d'),
                'activity_name': paid.sched_activities.name,
                'time_in': paid.time_in.strftime('%I:%M %p') if paid.time_in else "❌",
                'time_out': paid.time_out.strftime('%I:%M %p') if paid.time_out else "❌",
                'status': paid.status,
                'fines': f'₱{paid.fines:.2f}',
                'payment_status': "Paid ✅" if paid.is_paid else "Unpaid ❌",
            }
            all_paid_attendance.append(schedule_data)

        return jsonify({'success': True, 'data': all_paid_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})



#-------------unpiad list student
#unpaid events list
@manage_payment.route('/get_events_in_year_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_events_in_year_data():
    try:
        year = request.args.get('year', '')
        sort_by = request.args.get('sort_by', 'name')
        order = request.args.get('order', 'asc')

        if not year:
            return jsonify({"data": []})

        # Base query
        query = db.session.query(Schedule).join(Sched_activities).join(Attendance).filter(
            extract('year', Schedule.scheduled_date) == int(year),
            Schedule.is_ended == True,
            Attendance.is_paid == False,
            Attendance.fines != 0
        )

        # Apply sorting
        if sort_by == 'name':
            sort_column = Schedule.name
        elif sort_by == 'date':
            sort_column = Schedule.scheduled_date
        else:
            sort_column = Schedule.name  # fallback

        if order == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        events_in_selected_year = query.all()

        events_data = []
        for event in events_in_selected_year:
            unpaid_user_ids_subquery = db.session.query(Attendance.student_id).join(Sched_activities).filter(
                Sched_activities.schedule_id == event.id,
                Attendance.is_paid == False,
                Attendance.fines != 0
            ).distinct().subquery()

            unpaid_student_count = db.session.query(User).filter(User.id.in_(unpaid_user_ids_subquery)).count()
            
            data = {
                "id": event.id,
                "name": event.name,
                "date": event.scheduled_date.strftime('%Y-%B-%d-%A'),
                "unpaid_count": unpaid_student_count
            }

            events_data.append(data)

        return jsonify({"data": events_data})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

'''
#get the events in years
@manage_payment.route('/get_events_in_year_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_events_in_year_data():
    try:
        year = request.args.get('year', '')
        if not year:
            return jsonify({"data": []})

        events_in_selected_year = db.session.query(Schedule).join(Sched_activities).join(Attendance).filter(
            extract('year', Schedule.scheduled_date) == int(year),
            Schedule.is_ended==True,
            Attendance.is_paid==False,
            Attendance.fines!=0
        ).all()
        
        events_data = []
        for event in events_in_selected_year:
            
            unpaid_user_ids_subquery = db.session.query(Attendance.student_id).join(Sched_activities).filter(
                Sched_activities.schedule_id == event.id,
                Attendance.is_paid == False,
                Attendance.fines != 0
            ).distinct().subquery()

            # Count how many users match
            unpaid_student_count = db.session.query(User).filter(User.id.in_(unpaid_user_ids_subquery)).count()
            
            data = {
                "id": event.id,
                "name": event.name,
                "date": event.scheduled_date.strftime('%Y-%B-%d-%A '),
                "unpaid_count":unpaid_student_count
            }
            
            events_data.append(data)

        return jsonify({"data": events_data})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
'''   
    
#get unpaid attedance
@manage_payment.route('/get_all_unpiad_student_attendance', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_all_unpiad_student_attendance():
    try:
        selected_event = request.args.get('event', '').strip()
        selected_course = request.args.get('course', '').strip()
        selected_year = request.args.get('year', '').strip()
        selected_section = request.args.get('section', '').strip()

        all_attendance = []

        if not selected_event:
            return jsonify({'data': all_attendance})

        # Query attendance grouped by student
        query = db.session.query(
            Attendance.student_id,
            func.sum(Attendance.fines).label('total_fines'),
            User.first_name,
            User.last_name,
            Department.name.label('department'),
            Department.year,
            Department.section,
            Sched_activities.schedule_id,
            Schedule.name,
            Schedule.scheduled_date
        ).join(User, Attendance.student_id == User.id
        ).join(Sched_activities, Attendance.sched_activities_id == Sched_activities.id
        ).join(Schedule, Sched_activities.schedule_id == Schedule.id
        ).join(Department, User.department_id == Department.id      
        ).filter(
            Attendance.fines != 0,
            Attendance.is_paid == False,
            Schedule.is_ended == True,
            Sched_activities.schedule_id == selected_event  # ✅ Matching based on schedule ID
        )

        if selected_course:
            query = query.filter(Department.name == selected_course)
        if selected_year:
            query = query.filter(Department.year == selected_year)
        if selected_section:
            query = query.filter(Department.section == selected_section)

        query = query.group_by(
            Attendance.student_id,
            User.first_name,
            User.last_name,
            Department.name,
            Department.year,
            Department.section,
            Sched_activities.schedule_id,
            Schedule.name,
            Schedule.scheduled_date
        )

        results = query.all()

        for r in results:
            schedule_data = {
                'id': r.student_id,
                'student_name': f"{r.first_name} {r.last_name}",
                'department': r.department,
                'year': r.year,
                'section': r.section,
                'sched_activity_sched_id': r.schedule_id,
                'schedule_name':r.name,
                'schedule_date':r.scheduled_date.strftime('%Y-%B-%d-%A '),
                'total_fines': f'₱{float(r.total_fines):.2f}'

            }
            all_attendance.append(schedule_data)

        return jsonify({'data': all_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})




#get unpait atcitivity attendance
@manage_payment.route('/get_selected_unpaid_activity_attendance_data', methods=['GET'])
@login_required
@role_required_multiple('admin', 'ssg')
def get_selected_unpaid_activity_attendance_data():
    try:
        schedule_id = request.args.get('schedule_id', '')
        student_id = request.args.get('student_id', '')
 
        if not schedule_id:
            return jsonify({'success': False, 'message': 'Schedule ID is required.'})
        
        if not student_id:
            return jsonify({'success': False, 'message': 'student_id ID is required.'})


        unpaid_activities_attendance = db.session.query(Attendance).join(User).join(Sched_activities).filter(
            User.id==student_id,
            Attendance.is_paid == False,
            Sched_activities.schedule_id==schedule_id,
            Attendance.fines!=0,
            or_(
                Attendance.status=="absent",
                Attendance.status=="missed_out"
            )
            
        ).all()
        
        
        all_unpaid_attendance = []

        for unpaid in unpaid_activities_attendance:
            schedule_data = {
                'activity_name': unpaid.sched_activities.name,
                'time_in': unpaid.time_in.strftime('%I:%M %p') if unpaid.time_in else "❌",
                'time_out': unpaid.time_out.strftime('%I:%M %p') if unpaid.time_out else "❌",
                'status': unpaid.status,
                'fines': f'₱{unpaid.fines:.2f}',
                'payment_status': "Paid ✅" if unpaid.is_paid else "Unpaid 🚫 ",
            }
            all_unpaid_attendance.append(schedule_data)

        return jsonify({'success': True, 'data': all_unpaid_attendance})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})