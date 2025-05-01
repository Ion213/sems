#registered routes list

def routes_list(app):
    
    #public---------------------------------------------------------
    from .routes.public.public_views import public_views
    app.register_blueprint(public_views, url_prefix='/')
    
    
    
    
    #auth---------------------------------------------------------
    from .routes.auth.login import login
    app.register_blueprint(login, url_prefix='/')
    
    from .routes.auth.log_out import log_out
    app.register_blueprint(log_out, url_prefix='/')
    
    from .routes.auth.signup import signup
    app.register_blueprint(signup, url_prefix='/')
    
    from .routes.auth.verify_email import verify_email
    app.register_blueprint(verify_email, url_prefix='/')
    
    from .routes.auth.forgot_password import forgot_password
    app.register_blueprint(forgot_password, url_prefix='/')
    
    
    

    #admin-----------------------------------------------
    from .routes.admin.manage_event import manage_event
    app.register_blueprint(manage_event, url_prefix='/')
    
    from .routes.admin.manage_activities import manage_activities
    app.register_blueprint(manage_activities, url_prefix='/')
    
    from .routes.admin.manage_schedule import manage_schedule
    app.register_blueprint(manage_schedule, url_prefix='/')
    
    from .routes.admin.manage_ssg_account import manage_ssg_account
    app.register_blueprint(manage_ssg_account, url_prefix='/')
    
    from .routes.admin.manage_student_account import manage_student_account
    app.register_blueprint(manage_student_account, url_prefix='/')
    
    from .routes.admin.manage_department import manage_department
    app.register_blueprint(manage_department, url_prefix='/')
    
    from .routes.admin.manage_attendance import manage_attendance
    app.register_blueprint(manage_attendance, url_prefix='/')
    
    from .routes.admin.manage_payment import manage_payment
    app.register_blueprint(manage_payment, url_prefix='/')
    
    from .routes.admin.dashboard import dashboard
    app.register_blueprint(dashboard, url_prefix='/')
    
    
    
    
    #user-----------------------------------------------------
    from .routes.user.view_events import view_events
    app.register_blueprint(view_events, url_prefix='/')
    
    from .routes.user.view_profile import view_profile
    app.register_blueprint(view_profile, url_prefix='/')
    
    
    from .routes.user.change_password import change_password
    app.register_blueprint(change_password, url_prefix='/')

    from .routes.user.view_attendance_fine import view_attendance_fine
    app.register_blueprint(view_attendance_fine, url_prefix='/')