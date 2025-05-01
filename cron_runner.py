from website import flask_app, db
from website.cron_jobs import upcoming_to_ongoing, end_activities, end_schedule

def cron_run(app, db):
    upcoming_to_ongoing(app, db)
    end_activities(app, db)
    end_schedule(app, db)
    print('cron is running')

if __name__ == "__main__":
    app = flask_app()  # Initialize the Flask app
    with app.app_context():  # Ensure we run the cron jobs inside the app context
        cron_run(app, db)  # Run the cron jobs
