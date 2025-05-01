from website import db
from sqlalchemy.sql import func
from sqlalchemy import Enum
from pytz import timezone
from datetime import datetime,time
from flask_login import UserMixin

manila_tz = timezone('Asia/Manila')

#------------event model---------------------
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255),nullable=False)
    description = db.Column(db.String(500), nullable=True)
    date_created = db.Column(db.DateTime, nullable=False)
    date_updated= db.Column(db.DateTime, nullable=True)
    activities = db.relationship('Activities', backref='event', lazy=True, cascade="all, delete-orphan")

class Activities(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255),nullable=False)
    start_time = db.Column(db.Time,nullable=False)
    end_time = db.Column(db.Time,nullable=False)
    fines = db.Column(db.Float,nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
#----------------------------------------------

#------------schedule models---------------  
class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name=  db.Column(db.String(255),nullable=False)
    scheduled_date = db.Column(db.DateTime,nullable=False)
    is_ended=db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), nullable=False, default='upcoming') 
    
    sched_activities= db.relationship('Sched_activities', backref='schedule', lazy=True, cascade="all, delete-orphan")
    
    
class Sched_activities(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255),nullable=False)
    start_time = db.Column(db.DateTime,nullable=False)
    end_time = db.Column(db.DateTime,nullable=False)
    fines= db.Column(db.Float, nullable=False, default=0.0)
    is_ended=db.Column(db.Boolean, default=False)
    
    schedule_id= db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    attendances = db.relationship('Attendance', backref='sched_activities', lazy=True, cascade="all, delete-orphan")

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    time_in = db.Column(db.DateTime,nullable=True)
    time_out = db.Column(db.DateTime,nullable=True)
    fines=db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(50), nullable=False, default='absent') 
    is_paid=db.Column(db.Boolean, default=False)
    
    sched_activities_id = db.Column(db.Integer, db.ForeignKey('sched_activities.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
        # Nullable link to payment
    payment_id = db.Column(
        db.Integer,
        db.ForeignKey('payment.id', ondelete='SET NULL'),
        nullable=True
    )
    
 #------------------------  

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    year = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(100), nullable=True)
    user = db.relationship('User', backref='department', lazy=True, cascade="all, delete-orphan")

    
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    
    ssg_full_name = db.Column(db.String(100), nullable=True)  #only for SSG
    last_seen = db.Column(db.DateTime,nullable=True)
    
    student_ID = db.Column(db.String(20), unique=True, nullable=True)  # Only for students
    first_name = db.Column(db.String(100), nullable=True)             # Only for students
    last_name = db.Column(db.String(100), nullable=True)                # Only for students
    
    date_registered = db.Column(db.DateTime, nullable=True)
    date_updated = db.Column(db.DateTime, nullable=True)
    
    role = db.Column(db.String(50), nullable=False, default='student')  # 'student' or 'admin'
    is_verified = db.Column(db.Boolean, default=False)  # New field for email verification
    is_deactivated=db.Column(db.Boolean, default=False)
    
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True)  # Only for students
    attendance = db.relationship('Attendance', backref='user', lazy=True, cascade="all, delete-orphan") # Only for students
    logs = db.relationship('Logs', backref='user', lazy=True, cascade="all, delete-orphan") # Only for students
    payments = db.relationship('Payment', backref='user', lazy=True, cascade="all, delete-orphan")  # Track student payments
    
    
class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_code = db.Column(db.String(100), unique=True, nullable=False)
    transaction_date = db.Column(db.DateTime, default=datetime.now(manila_tz).replace(second=0,microsecond=0), nullable=False)
    total_fines = db.Column(db.Float, nullable=False)
    cash_amount = db.Column(db.Float, nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    change = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    payment_method = db.Column(db.String(50), default="manual", nullable=False)
    
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    attendances = db.relationship(
        'Attendance',
        backref=db.backref('payment', passive_deletes=True),
        lazy=True
    )
   
class Logs(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    activity_info= db.Column(db.String(100), nullable=True)
    activity_time = db.Column(db.DateTime,nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
     
