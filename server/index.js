require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const connectDB = require('./db');
const { signup, login, verifyToken } = require('./auth');
const { setupSocketHandlers } = require('./socketHandlers');
const roomManager = require('./roomManager');
const userRoutes = require('./routes/users');

const app = express();
connectDB();
const server = http.createServer(app);

// CORS
// CORS - Allow all origins for local testing
const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('VoiceRoom Server OK');
});

// ─── REST Auth Routes ───────────────────────────────────
app.use('/api/users', userRoutes);

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await signup(username, password);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await login(username, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// ─── REST Room Routes ───────────────────────────────────
app.get('/api/rooms', (req, res) => {
    const tags = req.query.tags ? req.query.tags.split(',') : null;
    const rooms = roomManager.listRooms(tags);
    res.json(rooms);
});

app.get('/api/tags', (req, res) => {
    res.json(roomManager.getAllTags());
});

// ─── Socket.IO ──────────────────────────────────────────
const io = new Server(server, {
    cors: corsOptions,
    path: '/socket.io' // Explicitly set path
});

// Socket auth middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    const user = verifyToken(token);
    if (!user) {
        return next(new Error('Invalid token'));
    }
    socket.user = user;
    next();
});

setupSocketHandlers(io);

// ─── PeerJS on Main Server ──────────────────────────────
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs', // CHANGED: Restrict WS upgrade to /peerjs path only
    allow_discovery: true,
});

app.use('/peerjs', peerServer);

// ─── Start Main Server ──────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🎙️  VoiceRoom server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready at /socket.io`);
    console.log(`📡 PeerJS ready at /peerjs`);
});

// ─── Error Handling ─────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
