


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = './db.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], messages: [] }, null, 2));
}

function getDB() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// Firebase login ke baad user ko database me register karne ke liye
app.post('/api/register-user', (req, res) => {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    const db = getDB();
    let user = db.users.find(u => u.phone === phone);
    if (!user) {
        user = { phone, name: name || 'VKM Member', joinedAt: new Date().toISOString() };
        db.users.push(user);
        saveDB(db);
    }
    res.json({ success: true, message: "User registered successfully", user });
});

// Owner Secret Data View Endpoint
app.get('/api/owner/data', (req, res) => {
    const secretKey = req.headers['x-owner-key'];
    if (secretKey !== 'vkm@owner123') {
        return res.status(403).json({ error: "Access Denied!" });
    }
    res.json(getDB());
});

// Real-time Socket.io Chat
io.on('connection', (socket) => {
    socket.on('join', ({ phone, name }) => {
        socket.phone = phone;
        socket.name = name || 'VKM Member';
        io.emit('systemMessage', `${socket.name} (${phone}) chat me jud gaye hain.`);
    });

    socket.on('sendMessage', (data) => {
        const db = getDB();
        const msgObj = {
            id: Date.now(),
            senderPhone: socket.phone,
            senderName: socket.name || 'VKM Member',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        db.messages.push(msgObj);
        saveDB(db);

        io.emit('receiveMessage', msgObj);
    });

    socket.on('disconnect', () => {
        if (socket.name) {
            io.emit('systemMessage', `${socket.name} chat se chale gaye hain.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`VKM Chats Server running on port ${PORT}`));

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000:
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


