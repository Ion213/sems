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

from website import db
from website.models.database_models import User,Logs

manage_ssg_account = Blueprint('manage_ssg_account', __name__)

#rendeder manage ssg account html
@manage_ssg_account.route('/manage_ssg_account_page', methods=['GET'])
@login_required
@role_required('admin')
def manage_ssg_account_page():
    return render_template('admin/manage_ssg_account.jinja2')


#get ssg data
@manage_ssg_account.route('/ssg_account_data', methods=['GET'])
@login_required
@role_required('admin')
def ssg_account_data():
    try:
        
        now_utc = datetime.now(tz.utc).replace(second=0, microsecond=0)
        online_threshold = now_utc - timedelta(minutes=5)
        #now = datetime.now(manila_tz).replace(second=0, microsecond=0)
        #online_threshold = now_utc - timedelta(minutes=5)

        ssg=User.query.filter_by(role='ssg').all()
        all_ssg = []
        
        for sg in ssg:
            if sg.last_seen:
                last_seen_utc = sg.last_seen.astimezone(tz.utc).replace(second=0, microsecond=0)
                is_online = last_seen_utc >= online_threshold
                #last_seen = sg.last_seen.astimezone(manila_tz).replace(second=0, microsecond=0)
                #is_online = last_seen >= online_threshold
            else:
                is_online = False
            
            ssg_data = {
                'id': sg.id,
                'name':sg.ssg_full_name,
                'email':sg.email,
                'password':sg.password,
                'hide_password':('*'* len(sg.password)),
                'date_registered':sg.date_registered.strftime('%Y-%B-%d-%A %I:%M %p') if sg.date_registered else None,
                #'date_updated':sg.date_updated.strftime('%Y-%B-%d-%A %I:%M %p') if sg.date_updated else None,
                'status':'online🟢' if is_online else 'offline🔴',
            }
            
            all_ssg.append(ssg_data)
        return jsonify({'data': all_ssg})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
#add ssg account
@manage_ssg_account.route('/add_ssg_account', methods=['POST'])
@login_required
@role_required('admin')
def add_ssg_account():
    try:

        email = request.form.get('email')
        ssg_name = request.form.get('ssg_name')
        password = request.form.get('password')
        role="ssg"


        if not email:
            return jsonify({'success': False, 'message': 'SSG Email cannot be empty'})
        if not ssg_name:
            return jsonify({'success': False, 'message': 'SSG Name cannot be empty'})
        if not password:
            return jsonify({'success': False, 'message': 'SSG Password cannot be empty'})
        
        #hashed_password = generate_password_hash(passwordV, method='pbkdf2:sha512')

        existing_email= User.query.filter_by(
            email=email
            ).first()
        
        existing_ssg_name= User.query.filter(
            func.lower(User.ssg_full_name)==ssg_name.lower()
            ).first()

        if existing_email:
            return jsonify({'success': False, 'message': 'email already used'})
        if existing_ssg_name:
            return jsonify({'success': False, 'message': 'Name already exist'})

        ssgAdd = User(
            ssg_full_name=ssg_name,
            email=email,
            password=password,
            role=role,
            date_registered=datetime.now(manila_tz).replace(second=0,microsecond=0),
            is_verified=True
            )
        db.session.add(ssgAdd)
        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    

#delete ssg account
@manage_ssg_account.route('/delete_ssg_account', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_ssg_account():
    try:
        # Fetch the event by ID and delete it
        ssg_id = request.json.get('ssg_id', [])
        
        if not ssg_id:
            return jsonify({'success': False, 'message': 'No SSG IDs provided'})
        
        # Fetch the ssg by ID and delete it
        ssgDel = User.query.get(ssg_id)
        if not ssgDel:
            return jsonify({'success': False, 'message': 'SSG not found'})
        
        db.session.delete(ssgDel)
        db.session.commit()
        return jsonify({'success': True, 'message': 'SSG Account deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

# Delete selected ssg account (API)
@manage_ssg_account.route('/delete_selected_ssg_accounts', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_selected_ssg_accounts():
    try:
        # Get the list of ssg IDs from the request
        ssg_ids = request.json.get('ssg_ids', [])
        
        if not ssg_ids:
            return jsonify({'success': False, 'message': 'No SSG IDs provided'})

        # Fetch all the ssg and delete them
        ssg_to_delete = User.query.filter(
            User.id.in_(ssg_ids)
            ).all()
        
        if not ssg_to_delete:
            return jsonify({'success': False, 'message': 'No SSG found for the provided IDs'})

        for ssg in ssg_to_delete:
            db.session.delete(ssg)  # Delete each ssg accounts 
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(ssg_to_delete)} SSG accounts deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    

#update ssg account
@manage_ssg_account.route('/update_ssg_account', methods=['PUT'])
@login_required
@role_required('admin')
def update_ssg_account():
    try:
        selected_ssg_account_id = request.form.get('selected_ssg_account_id')
        update_email = request.form.get('update_email')
        update_ssg_name = request.form.get('update_ssg_name')
        update_password = request.form.get('update_password')


        if not selected_ssg_account_id:
            return jsonify({'success': False, 'message': 'SSG ID not provided'})
        if not update_ssg_name:
            return jsonify({'success': False, 'message': 'SSG name cannot be empty'})
        if not update_email:
            return jsonify({'success': False, 'message': 'SSG email cannot be empty'})
        if not update_password:
            return jsonify({'success': False, 'message': 'SSG Password cannot be empty'})

        existing_email = User.query.filter(
            User.id != selected_ssg_account_id,
            User.email == update_email
            ).first()
        
        existing_name = User.query.filter(
            User.id != selected_ssg_account_id,
            func.lower(User.ssg_full_name) == update_ssg_name.lower()
        ).first()

        if existing_email:
            return jsonify({'success': False, 'message': 'Email Already Used'})
        if existing_name:
            return jsonify({'success': False, 'message': 'Name Already Exist'})
        


        # Update the ssg account
        ssgUp = User.query.get(selected_ssg_account_id)
        ssgUp.ssg_full_name=update_ssg_name
        ssgUp.email=update_email
        ssgUp.password=update_password
        ssgUp.date_updated=datetime.now(manila_tz).replace(microsecond=0,second=0)
        ssgUp.is_verified=True
        db.session.commit()
        return jsonify({'success': True, 'message': 'SSG account updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    
#______ssg_____logs

@manage_ssg_account.route('/view_ssg_logs', methods=['GET'])
@login_required
@role_required('admin')
def view_ssg_logs():
    try:
        ssg_id = request.args.get('ssg_id')

        if not ssg_id:
            return jsonify({'success': False, 'message': 'No SSG ID provided'})

        logs = Logs.query.filter(Logs.user_id == ssg_id).all()

        all_logs = [
            {
                'id': log.id,
                'activity_info': log.activity_info,
                'activity_time': log.activity_time.strftime('%Y-%B-%d-%A %I:%M %p')
            }
            for log in logs
        ]

        return jsonify({'success': True, 'data': all_logs})   # <<< ADD success=True HERE
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


#clear logs
@manage_ssg_account.route('/clear_ssg_logs', methods=['DELETE'])
@login_required
@role_required('admin')
def clear_ssg_logs():
    try:
        ssg_id = request.json.get('ssg_id')
        if not ssg_id:
            return jsonify({'success': False, 'message': 'No SSG ID provided'})

        # Ensure ssg_id is valid and convert to integer
        ssg_id = int(ssg_id)
        
        # Query all logs for the user
        logs_to_delete = Logs.query.filter(Logs.user_id == ssg_id).all()

        if not logs_to_delete:
            return jsonify({'success': False, 'message': 'No logs available to delete'})
        
        # Delete each log individually
        for log in logs_to_delete:
            db.session.delete(log)
        
        db.session.commit()

        return jsonify({'success': True, 'message': 'Logs cleared successfully'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})




