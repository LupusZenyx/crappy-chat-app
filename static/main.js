document.addEventListener('DOMContentLoaded', () => {
    const socket = io.connect('http://' + document.domain + ':' + location.port);
    const userList = document.getElementById('userList');
    const messageList = document.getElementById('messageList');
    const usernameInput = document.getElementById('username_input');
    const messageInput = document.getElementById('message_input');
    let username;

    function appendMessage(data) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
        messageList.appendChild(li);
    }

    socket.on('message', data => {
        appendMessage(data);
    });

    socket.on('user_join', data => {
        const li = document.createElement('li');
        li.innerHTML = data.username;
        userList.appendChild(li);
    });

    socket.on('user_list', data => {
        userList.innerHTML = ''; // Clear the user list and re-populate
        data.users.forEach(username => {
            const li = document.createElement('li');
            li.innerHTML = username;
            userList.appendChild(li);
        });
    });

    // Send a heartbeat message to the server periodically
    function sendHeartbeat() {
        socket.emit('heartbeat');
    }

    // Schedule sending heartbeats every 30 seconds (adjust as needed)
    setInterval(sendHeartbeat, 30000);
    document.querySelector('button[onclick="joinChat()"]').onclick = joinChat;

    function joinChat() {
        username = usernameInput.value;
        if (username) {
            socket.emit('join', { 'username': username });
            usernameInput.disabled = true;
        }
    }
    document.querySelector('button[onclick="sendMessage()"]').onclick = sendMessage;

    function sendMessage() {
        const message = messageInput.value;
        if (message) {
            socket.emit('message', { 'username': username, 'message': message });
            messageInput.value = '';
        }
    }

    messageInput.addEventListener('keyup', event => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle disconnect event (e.g., when the user leaves the page)
    window.addEventListener('beforeunload', () => {
        socket.emit('disconnect');
    });
});
