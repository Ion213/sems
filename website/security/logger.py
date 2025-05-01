# online_checker.py

from datetime import datetime
from flask_login import current_user

from pytz import timezone
from sqlalchemy import func
from datetime import datetime,time,timedelta
manila_tz = timezone('Asia/Manila')
from sqlalchemy import or_,and_,extract
from website import db

from website.models.database_models import Logs

def user_request_log(args):
    if current_user.is_authenticated and current_user.role=='ssg':
        add_logs=Logs(
            user_id=current_user.id,
            activity_info=f'{args} is logged in',
            activity_time=datetime.now(manila_tz).replace(second=0,microsecond=0)
        )
        db.session.add(add_logs)
        db.session.commit()
        
            
