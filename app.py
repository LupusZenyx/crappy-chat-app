from flask import Flask, render_template, request, current_app
from flask_socketio import SocketIO, emit
from threading import Thread
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app)

users = set()
user_last_activity = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    user_last_activity[request.sid] = time.time()

@socketio.on('join')
def handle_join(data):
    username = data['username']
    users.add(username)
    emit('user_join', {'username': username}, broadcast=True)
    send_user_list()
    user_last_activity[request.sid] = time.time()

@socketio.on('message')
def handle_message(data):
    user_last_activity[request.sid] = time.time()
    emit('message', data, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect(sid=None):
    if sid:
        username = [k for k, v in user_last_activity.items() if v == sid]
        if username:
            users.discard(username[0])
            emit('user_leave', {'username': username[0]}, broadcast=True)
            send_user_list()
    elif request.sid in user_last_activity:
        username = [k for k, v in user_last_activity.items() if v == request.sid]
        if username:
            users.discard(username[0])
            emit('user_leave', {'username': username[0]}, broadcast=True)
            send_user_list()

def send_user_list():
    emit('user_list', {'users': list(users)}, broadcast=True)

def check_user_activity():
    with app.app_context():
        heartbeat_interval = 10

        while True:
            current_time = time.time()
            for sid, last_activity_time in list(user_last_activity.items()):
                if current_time - last_activity_time > heartbeat_interval:
                    handle_disconnect(sid)
            time.sleep(heartbeat_interval)

if __name__ == '__main__':
    thread = Thread(target=check_user_activity)
    thread.daemon = False
    thread.start()
    socketio.run(app, host='0.0.0.0', port=8000, debug=False)
