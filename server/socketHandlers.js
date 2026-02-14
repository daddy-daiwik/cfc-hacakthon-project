const roomManager = require('./roomManager');

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        const user = socket.user; // Set by auth middleware
        console.log(`✅ ${user.username} connected (${socket.id})`);

        // Track which room this socket is in
        let currentRoomId = null;

        // ─── Room Events ───────────────────────────────────

        socket.on('room:create', ({ title, tags, type, accessCode }, callback) => {
            try {
                const room = roomManager.createRoom({
                    hostId: user.id,
                    hostName: user.username,
                    title,
                    tags,
                    type,
                    accessCode,
                });
                currentRoomId = room.id;
                socket.join(room.id);

                // Broadcast new room to everyone on the feed
                io.emit('room:list-update', roomManager.listRooms());

                callback({ success: true, room });
            } catch (err) {
                callback({ success: false, error: err.message });
            }
        });

        socket.on('room:join', ({ roomId, accessCode }, callback) => {
            try {
                const existingRoom = roomManager.getRoom(roomId);
                if (existingRoom && existingRoom.type === 'private') {
                    if (existingRoom.hostId !== user.id && existingRoom.accessCode !== accessCode) {
                        return callback({ success: false, error: 'Invalid access code' });
                    }
                }

                // If already in a different room, leave it first
                if (currentRoomId && currentRoomId !== roomId) {
                    handleLeaveRoom();
                }

                const room = roomManager.joinRoom(roomId, user);
                currentRoomId = roomId;
                socket.join(roomId);

                // Notify everyone in the room
                io.to(roomId).emit('room:user-joined', {
                    participant: { id: user.id, name: user.username, isMuted: false, hasRaisedHand: false },
                    participants: room.participants,
                });

                // Update feed for everyone
                io.emit('room:list-update', roomManager.listRooms());

                callback({ success: true, room });
            } catch (err) {
                callback({ success: false, error: err.message });
            }
        });

        socket.on('room:leave', (callback) => {
            if (!currentRoomId) return callback?.({ success: false, error: 'Not in a room' });

            handleLeaveRoom();
            callback?.({ success: true });
        });

        socket.on('room:end', (callback) => {
            if (!currentRoomId) return callback?.({ success: false, error: 'Not in a room' });

            const room = roomManager.getRoom(currentRoomId);
            if (!room) return callback?.({ success: false, error: 'Room not found' });

            if (room.hostId !== user.id) {
                return callback?.({ success: false, error: 'Only the host can end the room' });
            }

            // Notify everyone in the room that it's ended
            io.to(currentRoomId).emit('room:ended', { roomId: currentRoomId });

            roomManager.endRoom(currentRoomId);
            socket.leave(currentRoomId);
            currentRoomId = null;

            // Update feed
            io.emit('room:list-update', roomManager.listRooms());

            callback?.({ success: true });
        });

        socket.on('room:get', ({ roomId }, callback) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return callback({ success: false, error: 'Room not found' });
            callback({ success: true, room });
        });

        socket.on('room:list', ({ tags } = {}, callback) => {
            const rooms = roomManager.listRooms(tags);
            callback({ success: true, rooms });
        });

        socket.on('room:find-by-code', ({ code }, callback) => {
            // Try to find by ID first
            let room = roomManager.getRoom(code);
            
            // If not found by ID, try Access Code
            if (!room) {
                room = roomManager.getRoomByCode(code);
            }

            if (!room) return callback({ success: false, error: 'Room not found' });
            callback({ success: true, roomId: room.id, title: room.title });
        });

        // ─── WebRTC / PeerJS ────────────────────────────────

        socket.on('peer:register', ({ roomId, peerId }) => {
            roomManager.setParticipantPeerId(roomId, user.id, peerId);
            // Notify others in the room about this peer
            socket.to(roomId).emit('peer:new', {
                userId: user.id,
                username: user.username,
                peerId,
            });
        });

        socket.on('peer:get-peers', ({ roomId }, callback) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return callback({ success: false, error: 'Room not found' });
            const peers = room.participants
                .filter(p => p.peerId && p.id !== user.id)
                .map(p => ({ userId: p.id, username: p.name, peerId: p.peerId }));
            callback({ success: true, peers });
        });

        // ─── Chat ───────────────────────────────────────────

        socket.on('chat:message', ({ roomId, text }, callback) => {
            if (!text || !text.trim()) return callback?.({ success: false, error: 'Empty message' });

            const msg = roomManager.addMessage(roomId, {
                userId: user.id,
                username: user.username,
                text: text.trim(),
            });

            if (!msg) return callback?.({ success: false, error: 'Room not found' });

            io.to(roomId).emit('chat:new-message', msg);
            callback?.({ success: true, message: msg });
        });

        // ─── Moderation ─────────────────────────────────────

        socket.on('mod:mute', ({ roomId, userId: targetUserId }) => {
            const room = roomManager.getRoom(roomId);
            if (!room || room.hostId !== user.id) return;

            roomManager.muteParticipant(roomId, targetUserId);
            io.to(roomId).emit('mod:user-muted', { userId: targetUserId, participants: room.participants });
        });

        socket.on('mod:unmute', ({ roomId, userId: targetUserId }) => {
            const room = roomManager.getRoom(roomId);
            if (!room || room.hostId !== user.id) return;

            roomManager.unmuteParticipant(roomId, targetUserId);
            io.to(roomId).emit('mod:user-unmuted', { userId: targetUserId, participants: room.participants });
        });

        socket.on('mod:kick', ({ userId }) => {
            const room = roomManager.getRoom(currentRoomId);
            if (!room || room.hostId !== user.id) return;

            roomManager.kickParticipant(currentRoomId, userId);

            // Notify the kicked user
            io.to(currentRoomId).emit('mod:user-kicked', { userId });

            // Update list
            io.to(currentRoomId).emit('room:participants-update', { participants: room.participants });
        });

        socket.on('mod:mute-all', ({ roomId }) => {
            const room = roomManager.getRoom(roomId);
            if (!room || room.hostId !== user.id) {
                console.log('Mute all denied:', { hasRoom: !!room, isHost: room?.hostId === user.id });
                return;
            }

            const mutedUsers = roomManager.muteAllParticipants(roomId, user.id);
            console.log('Muting users:', mutedUsers);

            // Notify each user they are muted (to force local mute)
            mutedUsers.forEach(uid => {
                io.to(currentRoomId).emit('mod:user-muted', { userId: uid });
            });

            // Update list for everyone
            io.to(currentRoomId).emit('room:participants-update', { participants: room.participants });
        });

        socket.on('mod:toggle-speakers', ({ allowed }) => {
            const room = roomManager.getRoom(currentRoomId);
            if (!room || room.hostId !== user.id) return;

            roomManager.updateRoomSettings(currentRoomId, { speakersAllowed: allowed });
            io.to(currentRoomId).emit('room:settings-update', { speakersAllowed: allowed });

            // If Stage Mode enabled (speakers NOT allowed), mute everyone except host
            if (!allowed) {
                const mutedUsers = roomManager.muteAllParticipants(currentRoomId, user.id);
                mutedUsers.forEach(uid => {
                    io.to(currentRoomId).emit('mod:user-muted', { userId: uid });
                });
                io.to(currentRoomId).emit('room:participants-update', { participants: room.participants });
            }
        });

        // ─── Raise Hand ─────────────────────────────────────

        socket.on('hand:raise', ({ roomId }) => {
            const room = roomManager.raiseHand(roomId, user.id);
            if (room) {
                io.to(roomId).emit('hand:raised', { userId: user.id, participants: room.participants });
            }
        });

        socket.on('hand:lower', ({ roomId }) => {
            const room = roomManager.lowerHand(roomId, user.id);
            if (room) {
                io.to(roomId).emit('hand:lowered', { userId: user.id, participants: room.participants });
            }
        });

        // ─── Toggle Mute (self) ─────────────────────────────

        socket.on('self:toggle-mute', ({ roomId, isMuted }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;
            if (isMuted) {
                roomManager.muteParticipant(roomId, user.id);
            } else {
                roomManager.unmuteParticipant(roomId, user.id);
            }
            io.to(roomId).emit('room:participants-update', { participants: room.participants });
        });

        // ─── Disconnect ─────────────────────────────────────

        socket.on('disconnect', () => {
            console.log(`❌ ${user.username} disconnected`);
            if (currentRoomId) {
                handleLeaveRoom();
            }
        });

        // ─── Helper ─────────────────────────────────────────

        function handleLeaveRoom() {
            const roomId = currentRoomId;
            const result = roomManager.leaveRoom(roomId, user.id);
            socket.leave(roomId);
            currentRoomId = null;

            if (result) {
                if (result.closed) {
                    io.to(roomId).emit('room:ended', { roomId });
                } else {
                    io.to(roomId).emit('room:user-left', {
                        userId: user.id,
                        participants: result.participants,
                    });
                    if (result.hostId !== user.id) {
                        io.to(roomId).emit('room:host-changed', {
                            hostId: result.hostId,
                            hostName: result.hostName,
                        });
                    }
                }
            }

            io.emit('room:list-update', roomManager.listRooms());
        }
    });
}

module.exports = { setupSocketHandlers };
