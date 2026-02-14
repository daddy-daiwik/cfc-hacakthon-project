const io = require('socket.io-client');
const axios = require('axios');

// Using 127.0.0.1 explicitly to avoid IPv6 issues
const API_URL = 'http://127.0.0.1:3001/api';
const SOCKET_URL = 'http://127.0.0.1:3001';

async function test() {
    try {
        console.log('1. Signing up...');
        const authRes = await axios.post(`${API_URL}/auth/signup`, {
            username: `TestUser_${Date.now()}`,
            password: 'password123'
        }, {
            timeout: 5000 // 5s timeout
        });
        const { token, user } = authRes.data;
        console.log('✅ Signup successful:', user.username);

        console.log('2. Connecting socket...');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: false
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);

            console.log('3. Creating room...');
            socket.emit('room:create', {
                title: 'Test Room',
                tags: ['test', 'debug']
            }, (response) => {
                if (response.success) {
                    console.log('✅ Room created successfully:', response.room.id);
                    console.log('   Title:', response.room.title);

                    console.log('4. Listing rooms...');
                    socket.emit('room:list', {}, (listRes) => {
                        console.log('✅ Room list received. Count:', listRes.rooms.length);
                        socket.disconnect();
                        process.exit(0);
                    });
                } else {
                    console.error('❌ Room creation failed (server returned error):', response.error);
                    socket.disconnect();
                    process.exit(1);
                }
            });
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
            process.exit(1);
        });

        // Timeout if socket doesn't connect
        setTimeout(() => {
            console.error('❌ Socket connection timed out');
            process.exit(1);
        }, 5000);

    } catch (err) {
        console.error('❌ Error during HTTP request:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('   Server is likely not running on port 3001');
        }
        if (err.response) console.error('   Response:', err.response.data);
        process.exit(1);
    }
}

test();
