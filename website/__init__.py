from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
import os
from datetime import timedelta,datetime

from flask_mail import (
    Mail,
    Message
    )
from itsdangerous import URLSafeTimedSerializer

from flask import render_template

from .register_routes import routes_list
from .smtp_account import dtc_email,dtc_password
#from .aps_jobs import start_scheduler  # Import scheduler
import atexit

#from .security.request_limiter import user_request_Limit,user_email_or_ip_limit

from flask_login import current_user
from pytz import timezone
from datetime import timezone as tz
manila_tz = timezone('Asia/Manila')

#create database object
db=SQLAlchemy()
#DB_NAME ="database.db"

#smtp
mail = Mail()

#create migration so that you can migrate youre models(using cmd)
migrate = Migrate()

#create flask app
def flask_app():
    
    app = Flask(__name__,static_folder='templates/static')
    app.config['SECRET_KEY']= 'ion21'
    #db_path = os.path.join(app.root_path, 'database', DB_NAME)
    #app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
    #app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=7)
    app.config['REMEMBER_COOKIE_DURATION'] = timedelta(hours=4)
    
    
    
    # ✅ Use MySQL instead of SQLite
    # Format: mysql+pymysql://username:password@host/database_name
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://danaotec_sems_admin:%40admin2025@localhost:3306/danaotec_sems"
    )
    


    # Email Configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465  # Use 465 for SSL
    app.config['MAIL_USE_SSL'] = True  # Enable SSL
    app.config['MAIL_USE_TLS'] = False  # Disable TLS
    app.config['MAIL_USERNAME'] = dtc_email  
    app.config['MAIL_PASSWORD'] = dtc_password  # Use App Password



    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)  # Initialize Flask-Mail
    
    #implement login manager(sessions)
    # LoginManager initialization
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'public_views.event_preview'
    
    from .models.database_models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)
    
    # Online checker
    @app.before_request
    def update_last_seen():
        if current_user.is_authenticated and current_user.role in ['ssg', 'student']:
            now_utc = datetime.now(tz.utc).replace(second=0, microsecond=0)
            #now = datetime.now(manila_tz).replace(second=0, microsecond=0)
            
            # Ensure last_seen is timezone-aware and in UTC
            if current_user.last_seen:
                last_seen = current_user.last_seen.astimezone(tz.utc).replace(second=0, microsecond=0)
                #last_seen = current_user.last_seen.astimezone(manila_tz).replace(second=0, microsecond=0)
            else:
                last_seen = None

            # Update last_seen only if it's None or more than 1 minute since last update
            if not last_seen or (now_utc - last_seen > timedelta(minutes=1)):
                current_user.last_seen = now_utc
                db.session.commit()

    
    '''
    #limiter  page
    @app.errorhandler(429)
    def ratelimit_error(e):
        return render_template("auth/429.jinja2", message="Too many requests. Please try again later."), 429
    '''

    # Register blueprints
    routes_list(app)
    
    #create database
    #create_database(app)
    
    '''
    #request limiter
    user_request_Limit.init_app(app)
    user_email_or_ip_limit.init_app(app)
    '''

    # Start the scheduler and pass db
    #start_scheduler(app, db)
    
    return app


''' 
#sqlite

# Create database function
def create_database(app):
    if not os.path.exists(os.path.join(app.root_path,'database', DB_NAME)):
        with app.app_context():
            db.create_all()
            
'''

#---------------------------------------------------------------
