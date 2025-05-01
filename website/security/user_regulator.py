from functools import wraps
from flask import redirect, url_for
from flask_login import current_user


#-----------------check if the user is allowed in particular routes
def role_required(required_role): # Accepts single roles as arguments
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role != required_role:
                return redirect(url_for('login.login_page'))  # Redirect to login or custom "access denied" page
            return func(*args, **kwargs)
        return wrapper
    return decorator

def role_required_multiple(*required_roles):  # Accepts multiple roles as arguments
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if current_user.role not in required_roles:  # Check if role is allowed
                return redirect(url_for('login.login_page'))  # Redirect if role is not allowed
            return func(*args, **kwargs)
        return wrapper
    return decorator


#-----------------check if already login or not
# ✅ Function to handle role-based redirection
def redirect_user_based_on_role(role):
    if role in ['admin', 'ssg']:
        return redirect(url_for('manage_event.manage_event_page'))
    elif role == 'student':
        return redirect(url_for('view_events.view_events_page'))
    return redirect(url_for('login.login_page'))
