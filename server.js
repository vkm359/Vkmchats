mkdir -p public
cat << 'EOF' > server.js
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
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], otps: {}, messages: [] }, null, 2));
}

function getDB() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

app.post('/api/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) return res.status(400).json({ error: "Sahi Phone Number daalein" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const db = getDB();
    db.otps[phone] = otp;
    
    if (!db.users.find(u => u.phone === phone)) {
        db.users.push({ phone, joinedAt: new Date().toISOString() });
    }
    saveDB(db);

    console.log(`[VKM LOG] OTP for ${phone} is: ${otp}`);
    res.json({ success: true, message: "OTP bhej diya gaya hai (Testing OTP Termux screen par dikhega)" });
});

app.post('/api/verify-otp', (req, res) => {
    const { phone, otp, name } = req.body;
    const db = getDB();

    if (db.otps[phone] && db.otps[phone] === otp) {
        delete db.otps[phone];
        const user = db.users.find(u => u.phone === phone);
        if (user) user.name = name || 'VKM Member';
        saveDB(db);
        return res.json({ success: true, token: `VKM-AUTH-${phone}` });
    }
    res.status(400).json({ error: "Galat OTP!" });
});

app.get('/api/owner/data', (req, res) => {
    const secretKey = req.headers['x-owner-key'];
    if (secretKey !== 'vkm@owner123') {
        return res.status(403).json({ error: "Access Denied!" });
    }
    res.json(getDB());
});

io.on('connection', (socket) => {
    socket.on('join', ({ phone, name }) => {
        socket.phone = phone;
        socket.name = name;
        io.emit('systemMessage', `${name} (${phone}) active hain.`);
    });

    socket.on('sendMessage', (data) => {
        const db = getDB();
        const msgObj = {
            id: Date.now(),
            senderPhone: socket.phone,
            senderName: socket.name,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        db.messages.push(msgObj);
        saveDB(db);

        io.emit('receiveMessage', msgObj);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`VKM Server Running: http://localhost:${PORT}`));
EOF

