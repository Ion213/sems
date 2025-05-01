from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request

# Rate limiter for general requests based on IP
user_request_Limit = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

# Rate limiter for requests based on email or IP
def get_email_or_ip():
    return request.form.get('email') or request.remote_addr

user_email_or_ip_limit = Limiter(
    key_func=get_email_or_ip,
    default_limits=["100 per hour"]
)


