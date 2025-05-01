from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone

from datetime import datetime
from sqlalchemy import or_,and_,extract
from sqlalchemy import not_, and_
from sqlalchemy.sql import func



scheduler = BackgroundScheduler()

# Function to add jobs to the scheduler
def add_jobs_to_scheduler(app, db):
    # Pass `db` to the job functions to ensure they have access
    

    
    
    scheduler.add_job(func=end_activities, trigger="interval", seconds=25, args=[app, db])
    scheduler.add_job(func=upcoming_to_ongoing, trigger="interval", seconds=15, args=[app, db])
    scheduler.add_job(func=end_schedule, trigger="interval", seconds=60, args=[app, db])



# Function to start the scheduler
def start_scheduler(app, db):
    add_jobs_to_scheduler(app, db)  # Pass app and db instance here to schedule jobs
    scheduler.start()


#check if still upcoming
def upcoming_to_ongoing(app, db):
    with app.app_context():
        from .models.database_models import Schedule, Sched_activities
        manila_tz = timezone('Asia/Manila')
        
        upcoming=Schedule.query.filter(
            Schedule.is_ended==False,
            Schedule.status=="upcoming"
            ).all()
        
        if upcoming:
            update=False
            for schedule in upcoming:
                if schedule.scheduled_date.date() <= datetime.now(manila_tz).date():
                    schedule.status="ongoing"
                    update=True
                    
                if update:
                    print(f"The schedule: '{schedule.name}' is marked as ongoing")  
                    db.session.commit()
        else:
            print("No upocoming schedule")      

'''
#end each activities if ended
def end_activities(app, db):
    with app.app_context():
        from .models.database_models import Schedule, Sched_activities,User,Attendance
        manila_tz = timezone('Asia/Manila')
        
        # Get ongoing schedules
        ongoing = Schedule.query.filter(
            Schedule.status == "ongoing",
            Schedule.is_ended == False,
        ).all()
        if ongoing:
            for schedule in ongoing:
                # Get unfinished activities
                activities = Sched_activities.query.filter(
                    Sched_activities.schedule_id == schedule.id,
                    Sched_activities.is_ended == False,
                ).all()
                
                if activities:
                    for activity in activities:
                        # Localize if needed
                        if activity.end_time.tzinfo is None:
                            end_time_local = manila_tz.localize(activity.end_time)
                        else:
                            end_time_local = activity.end_time.astimezone(manila_tz)

                        if end_time_local < datetime.now(manila_tz):
                            activity.is_ended = True
                            db.session.commit()  # Commit immediately per updated activity
                            print(f"The activity: '{activity.name}' is marked as ended in Schedule: {schedule.name}.")
        else:
            print("No ongoing schedules for checking the ended activities")

 '''
 #end each activities if ended
def end_activities(app, db):
    

    with app.app_context():
        from .models.database_models import Schedule, Sched_activities, User, Attendance
        manila_tz = timezone('Asia/Manila')

        # Get ongoing schedules
        ongoing_schedules = Schedule.query.filter(
            Schedule.status == "ongoing",
            Schedule.is_ended == False
        ).all()

        if not ongoing_schedules:
            print("No ongoing schedules for checking the ended activities")
            return

        for schedule in ongoing_schedules:
            # Get all unended activities for this schedule
            activities = Sched_activities.query.filter(
                Sched_activities.schedule_id == schedule.id,
                Sched_activities.is_ended == False
            ).all()

            for activity in activities:
                # Convert end_time to Manila timezone
                end_time_local = activity.end_time
                if end_time_local.tzinfo is None:
                    end_time_local = manila_tz.localize(end_time_local)
                else:
                    end_time_local = end_time_local.astimezone(manila_tz)

                if end_time_local < datetime.now(manila_tz):
                    activity.is_ended = True

                    # Get students who already have attendance records for this activity
                    attended_student_ids = db.session.query(Attendance.student_id).filter(
                        Attendance.sched_activities_id == activity.id
                    ).all()

                    # Flatten the list of tuples
                    attended_ids = [student_id for (student_id,) in attended_student_ids]

                    # Get students who were not marked at all (i.e., absent or forgot to tap)
                    missing_students = User.query.filter(
                        User.role == 'student',
                        User.is_verified == True,
                        User.is_deactivated == False,
                        not_(User.id.in_(attended_ids))
                    ).all()

                    # Add them as absent entries
                    absent_attendance = []
                    for student in missing_students:
                        absent_attendance.append(Attendance(
                            sched_activities_id=activity.id,
                            student_id=student.id,
                            time_in=None,
                            time_out=None,
                            fines=activity.fines
                        ))

                    db.session.add_all(absent_attendance)
                    db.session.commit()

                    print(f"✅ Activity '{activity.name}' (ID: {activity.id}) is now ended for Schedule '{schedule.name}'.")

   
   
#end ongoing events that all activities has ended
def end_schedule(app, db):
    with app.app_context():
        from .models.database_models import Schedule
        
        ongoing = Schedule.query.filter(
            Schedule.is_ended == False,
            Schedule.status == "ongoing"
        ).all()
        
        if ongoing:
            
            for schedule in ongoing:
                if all(activity.is_ended for activity in schedule.sched_activities):
                    schedule.is_ended = True
                    schedule.status = "ended"
                    db.session.commit()
                    print(f"The schedule: '{schedule.name}' is marked as ended")
             
        else:
            print("No ongoing schedules to end")
                    
        